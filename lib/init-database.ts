import { sessionManager } from '@/lib/session-manager';
import { databaseService } from '@/lib/services/databaseService';
import { validateAuthConfig } from '@/lib/auth-config';
import { initializeKitchenSystem } from '@/lib/kitchen-system-migration';

export async function initializeDatabase() {
  console.log('Initializing database...');

  try {
    // Validate authentication configuration
    validateAuthConfig();
    console.log('✅ Auth configuration validated');

    // Initialize session management tables
    await sessionManager.initializeTables();
    console.log('✅ Session management tables initialized');

    // Create customers table if it doesn't exist
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_login_attempts (login_attempts)
      )
    `);
    console.log('✅ Customers table initialized');

    // Update admin_users table with security columns if they don't exist
    try {
      // Check if login_attempts column exists
      await databaseService.query(`
        SELECT login_attempts FROM admin_users LIMIT 1
      `);
      console.log('✅ login_attempts column already exists');
    } catch (error) {
      // Column doesn't exist, add it
      await databaseService.query(`
        ALTER TABLE admin_users 
        ADD COLUMN login_attempts INT DEFAULT 0
      `);
      console.log('✅ Added login_attempts column to admin_users');
    }

    try {
      // Check if locked_until column exists
      await databaseService.query(`
        SELECT locked_until FROM admin_users LIMIT 1
      `);
      console.log('✅ locked_until column already exists');
    } catch (error) {
      // Column doesn't exist, add it
      await databaseService.query(`
        ALTER TABLE admin_users 
        ADD COLUMN locked_until TIMESTAMP NULL
      `);
      console.log('✅ Added locked_until column to admin_users');
    }

    console.log('✅ Admin users table updated with security features');

    // Create audit log table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id VARCHAR(255),
        user_type ENUM('customer', 'admin') NOT NULL,
        action VARCHAR(100) NOT NULL,
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_action (user_id, user_type, action),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ Audit logs table initialized');

    // Create password reset tokens table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id VARCHAR(255) NOT NULL,
        user_type ENUM('customer', 'admin') NOT NULL,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token_hash (token_hash),
        INDEX idx_expires_at (expires_at),
        INDEX idx_user_type (user_id, user_type)
      )
    `);
    console.log('✅ Password reset tokens table initialized');

    // Create promo_codes table if it doesn't exist
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
        discount_value DECIMAL(10,2) NOT NULL,
        minimum_order_amount DECIMAL(10,2) DEFAULT 0.00,
        maximum_discount DECIMAL(10,2) NULL,
        usage_limit INT NULL,
        used_count INT DEFAULT 0,
        valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valid_until TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT true,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Promo codes table initialized');

    // Create promo_code_usage table if it doesn't exist
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS promo_code_usage (
        id INT PRIMARY KEY AUTO_INCREMENT,
        promo_code_id INT NOT NULL,
        order_id INT NOT NULL,
        customer_id INT NULL,
        customer_email VARCHAR(255) NULL,
        discount_amount DECIMAL(10,2) NOT NULL,
        order_amount DECIMAL(10,2) NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Promo code usage table initialized');

    // Create indexes for promo codes
    await databaseService.query(`
      CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
      CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
      CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_until ON promo_codes(valid_until);
      CREATE INDEX IF NOT EXISTS idx_promo_code_usage_promo_code_id ON promo_code_usage(promo_code_id);
      CREATE INDEX IF NOT EXISTS idx_promo_code_usage_order_id ON promo_code_usage(order_id);
      CREATE INDEX IF NOT EXISTS idx_promo_code_usage_customer_id ON promo_code_usage(customer_id);
    `);
    console.log('✅ Promo codes indexes created');

    // Add promo code columns to orders table if they don't exist
    try {
      await databaseService.query(`
        SELECT promo_code_id FROM orders LIMIT 1
      `);
      console.log('✅ Promo code columns already exist in orders table');
    } catch (error) {
      await databaseService.query(`
        ALTER TABLE orders 
        ADD COLUMN promo_code_id INT NULL AFTER payment_status,
        ADD COLUMN promo_code VARCHAR(50) NULL AFTER promo_code_id,
        ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00 AFTER promo_code,
        ADD FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL
      `);
      console.log('✅ Added promo code columns to orders table');
    }

    // Insert sample promo codes if table is empty
    const existingPromoCodes = await databaseService.query('SELECT COUNT(*) as count FROM promo_codes');
    if (existingPromoCodes[0]?.count === 0) {
      await databaseService.query(`
        INSERT INTO promo_codes (code, name, description, discount_type, discount_value, minimum_order_amount, usage_limit, valid_until) VALUES
        ('WELCOME10', 'Welcome Discount', '10% off for new customers', 'percentage', 10.00, 50.00, 100, DATE_ADD(NOW(), INTERVAL 30 DAY)),
        ('SAVE20', 'Save 20%', '20% off on orders above 100', 'percentage', 20.00, 100.00, 50, DATE_ADD(NOW(), INTERVAL 60 DAY)),
        ('FREESHIP', 'Free Shipping', 'Free shipping on orders above 200', 'fixed_amount', 50.00, 200.00, 200, DATE_ADD(NOW(), INTERVAL 90 DAY)),
        ('FLASH25', 'Flash Sale', '25% off flash sale', 'percentage', 25.00, 75.00, 25, DATE_ADD(NOW(), INTERVAL 7 DAY))
      `);
      console.log('✅ Sample promo codes inserted');
    }

    // Initialize kitchen system
    const kitchenResult = await initializeKitchenSystem();
    if (!kitchenResult.success) {
      console.error('❌ Kitchen system initialization failed:', kitchenResult.error);
      return { success: false, error: `Kitchen system initialization failed: ${kitchenResult.error}` };
    }

    console.log('🎉 Database initialization completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Function to log audit events
export async function logAuditEvent(
  userId: string,
  userType: 'customer' | 'admin',
  action: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await databaseService.query(
      `INSERT INTO audit_logs (user_id, user_type, action, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, userType, action, details ? JSON.stringify(details) : null, ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// Function to check if database is properly initialized
export async function checkDatabaseHealth() {
  try {
    const tables = [
      'customers',
      'admin_users',
      'user_sessions',
      'blacklisted_tokens',
      'audit_logs',
      'password_reset_tokens',
      'promo_codes',
      'promo_code_usage'
    ];

    const results = await Promise.all(
      tables.map(async (table) => {
        try {
          await databaseService.query(`SELECT 1 FROM ${table} LIMIT 1`);
          return { table, status: 'exists' };
        } catch (error) {
          return { table, status: 'missing', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      })
    );

    const missingTables = results.filter(r => r.status === 'missing');
    
    if (missingTables.length > 0) {
      console.warn('Missing tables:', missingTables);
      return { healthy: false, missingTables };
    }

    return { healthy: true, tables: results };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { healthy: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 