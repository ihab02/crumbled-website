import { databaseService } from '@/lib/services/databaseService';

export async function initializeKitchenSystem() {
  console.log('Initializing kitchen system...');

  try {
    // Create zones table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS zones (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_active (is_active)
      )
    `);
    console.log('✅ Zones table initialized');

    // Create kitchens table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS kitchens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        zone_id INT,
        capacity INT NOT NULL DEFAULT 10,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL,
        INDEX idx_zone (zone_id),
        INDEX idx_active (is_active),
        INDEX idx_name (name)
      )
    `);
    console.log('✅ Kitchens table initialized');

    // Create kitchen roles table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS kitchen_roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_active (is_active)
      )
    `);
    console.log('✅ Kitchen roles table initialized');

    // Create role permissions table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_id INT NOT NULL,
        permission_name VARCHAR(100) NOT NULL,
        permission_value VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES kitchen_roles(id) ON DELETE CASCADE,
        INDEX idx_role (role_id),
        INDEX idx_permission (permission_name, permission_value),
        UNIQUE KEY unique_role_permission (role_id, permission_name, permission_value)
      )
    `);
    console.log('✅ Role permissions table initialized');

    // Create kitchen users table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS kitchen_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_active (is_active)
      )
    `);
    console.log('✅ Kitchen users table initialized');

    // Create kitchen assignments table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS kitchen_assignments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        kitchen_id INT NOT NULL,
        role_id INT NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES kitchen_users(id) ON DELETE CASCADE,
        FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES kitchen_roles(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_kitchen (kitchen_id),
        INDEX idx_role (role_id),
        INDEX idx_primary (is_primary),
        UNIQUE KEY unique_user_kitchen (user_id, kitchen_id)
      )
    `);
    console.log('✅ Kitchen assignments table initialized');

    // Create kitchen sessions table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS kitchen_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        selected_kitchen_id INT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES kitchen_users(id) ON DELETE CASCADE,
        FOREIGN KEY (selected_kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE,
        INDEX idx_session_token (session_token),
        INDEX idx_user (user_id),
        INDEX idx_expires (expires_at)
      )
    `);
    console.log('✅ Kitchen sessions table initialized');

    // Create orders table (if not exists)
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        delivery_address TEXT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('received', 'preparing', 'packing', 'ready', 'dispatched', 'completed', 'cancelled') DEFAULT 'received',
        priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
        kitchen_id INT,
        assigned_to INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        estimated_completion_time TIMESTAMP NULL,
        actual_completion_time TIMESTAMP NULL,
        notes TEXT,
        FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_to) REFERENCES kitchen_users(id) ON DELETE SET NULL,
        INDEX idx_order_number (order_number),
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_kitchen (kitchen_id),
        INDEX idx_assigned (assigned_to),
        INDEX idx_created (created_at)
      )
    `);
    console.log('✅ Orders table initialized');

    // Create order items table (if not exists)
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        flavor_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_order (order_id),
        INDEX idx_product (product_id),
        INDEX idx_flavor (flavor_id)
      )
    `);
    console.log('✅ Order items table initialized');

    // Create batches table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS batches (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        kitchen_id INT NOT NULL,
        status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
        created_by INT NOT NULL,
        assigned_to INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        estimated_completion_time TIMESTAMP NULL,
        notes TEXT,
        FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES kitchen_users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES kitchen_users(id) ON DELETE SET NULL,
        INDEX idx_kitchen (kitchen_id),
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_created_by (created_by),
        INDEX idx_assigned_to (assigned_to),
        INDEX idx_created (created_at)
      )
    `);
    console.log('✅ Batches table initialized');

    // Create batch items table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS batch_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        batch_id INT NOT NULL,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        flavor_id INT NOT NULL,
        quantity INT NOT NULL,
        status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_batch (batch_id),
        INDEX idx_order (order_id),
        INDEX idx_status (status)
      )
    `);
    console.log('✅ Batch items table initialized');

    // Create notifications table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS kitchen_notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        kitchen_id INT NOT NULL,
        user_id INT,
        type ENUM('order', 'batch', 'system', 'alert') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES kitchen_users(id) ON DELETE SET NULL,
        INDEX idx_kitchen (kitchen_id),
        INDEX idx_user (user_id),
        INDEX idx_type (type),
        INDEX idx_read (is_read),
        INDEX idx_created (created_at)
      )
    `);
    console.log('✅ Kitchen notifications table initialized');

    // Insert default zones if none exist
    const zonesResult = await databaseService.query('SELECT COUNT(*) as count FROM zones');
    if (zonesResult[0].count === 0) {
      await databaseService.query(`
        INSERT INTO zones (name, description) VALUES 
        ('Zone A', 'Primary delivery zone'),
        ('Zone B', 'Secondary delivery zone'),
        ('Zone C', 'Extended delivery zone')
      `);
      console.log('✅ Default zones created');
    }

    // Insert default roles if none exist
    const rolesResult = await databaseService.query('SELECT COUNT(*) as count FROM kitchen_roles');
    if (rolesResult[0].count === 0) {
      await databaseService.query(`
        INSERT INTO kitchen_roles (name, description) VALUES 
        ('Kitchen Manager', 'Full kitchen management access'),
        ('Kitchen Staff', 'Basic kitchen operations'),
        ('Kitchen Assistant', 'Limited kitchen access')
      `);
      console.log('✅ Default roles created');

      // Insert default permissions for Kitchen Manager
      const managerRole = await databaseService.query('SELECT id FROM kitchen_roles WHERE name = "Kitchen Manager"');
      if (managerRole.length > 0) {
        await databaseService.query(`
          INSERT INTO role_permissions (role_id, permission_name, permission_value) VALUES 
          (?, 'orders', 'view'),
          (?, 'orders', 'update'),
          (?, 'orders', 'cancel'),
          (?, 'batches', 'create'),
          (?, 'batches', 'manage'),
          (?, 'batches', 'view'),
          (?, 'kitchen', 'manage'),
          (?, 'kitchen', 'view'),
          (?, 'users', 'manage'),
          (?, 'users', 'view'),
          (?, 'reports', 'view'),
          (?, 'notifications', 'send'),
          (?, 'notifications', 'view')
        `, [
          managerRole[0].id, managerRole[0].id, managerRole[0].id, managerRole[0].id,
          managerRole[0].id, managerRole[0].id, managerRole[0].id, managerRole[0].id,
          managerRole[0].id, managerRole[0].id, managerRole[0].id, managerRole[0].id,
          managerRole[0].id
        ]);
        console.log('✅ Default permissions for Kitchen Manager created');
      }

      // Insert default permissions for Kitchen Staff
      const staffRole = await databaseService.query('SELECT id FROM kitchen_roles WHERE name = "Kitchen Staff"');
      if (staffRole.length > 0) {
        await databaseService.query(`
          INSERT INTO role_permissions (role_id, permission_name, permission_value) VALUES 
          (?, 'orders', 'view'),
          (?, 'orders', 'update'),
          (?, 'batches', 'view'),
          (?, 'batches', 'manage'),
          (?, 'kitchen', 'view'),
          (?, 'notifications', 'view')
        `, [
          staffRole[0].id, staffRole[0].id, staffRole[0].id, staffRole[0].id,
          staffRole[0].id, staffRole[0].id
        ]);
        console.log('✅ Default permissions for Kitchen Staff created');
      }

      // Insert default permissions for Kitchen Assistant
      const assistantRole = await databaseService.query('SELECT id FROM kitchen_roles WHERE name = "Kitchen Assistant"');
      if (assistantRole.length > 0) {
        await databaseService.query(`
          INSERT INTO role_permissions (role_id, permission_name, permission_value) VALUES 
          (?, 'orders', 'view'),
          (?, 'batches', 'view'),
          (?, 'kitchen', 'view'),
          (?, 'notifications', 'view')
        `, [
          assistantRole[0].id, assistantRole[0].id, assistantRole[0].id, assistantRole[0].id
        ]);
        console.log('✅ Default permissions for Kitchen Assistant created');
      }
    }

    // Insert default kitchens if none exist
    const kitchensResult = await databaseService.query('SELECT COUNT(*) as count FROM kitchens');
    if (kitchensResult[0].count === 0) {
      const zoneA = await databaseService.query('SELECT id FROM zones WHERE name = "Zone A"');
      if (zoneA.length > 0) {
        await databaseService.query(`
          INSERT INTO kitchens (name, zone_id, capacity) VALUES 
          ('Main Kitchen', ?, 20),
          ('Secondary Kitchen', ?, 15)
        `, [zoneA[0].id, zoneA[0].id]);
        console.log('✅ Default kitchens created');
      }
    }

    console.log('🎉 Kitchen system initialization completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('❌ Kitchen system initialization failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Function to check kitchen system health
export async function checkKitchenSystemHealth() {
  try {
    const tables = [
      'zones',
      'kitchens',
      'kitchen_roles',
      'role_permissions',
      'kitchen_users',
      'kitchen_assignments',
      'kitchen_sessions',
      'orders',
      'order_items',
      'batches',
      'batch_items',
      'kitchen_notifications'
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
      console.warn('Missing kitchen system tables:', missingTables);
      return { healthy: false, missingTables };
    }

    return { healthy: true, tables: results };
  } catch (error) {
    console.error('Kitchen system health check failed:', error);
    return { healthy: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 