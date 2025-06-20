import { sessionManager } from '@/lib/session-manager';
import { databaseService } from '@/lib/services/databaseService';
import { validateAuthConfig } from '@/lib/auth-config';

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
      'password_reset_tokens'
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