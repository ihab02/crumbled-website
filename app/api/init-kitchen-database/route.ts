import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

/**
 * POST /api/init-kitchen-database
 * Initialize kitchen system database tables
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Initializing kitchen system database...');

    // Create zones table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS zones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create kitchens table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS kitchens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        zone_id INT,
        capacity INT DEFAULT 10,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (zone_id) REFERENCES zones(id)
      )
    `);

    // Create kitchen_roles table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS kitchen_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create role_permissions table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        permission_name VARCHAR(100) NOT NULL,
        permission_value VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES kitchen_roles(id) ON DELETE CASCADE
      )
    `);

    // Create kitchen_users table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS kitchen_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create kitchen_assignments table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS kitchen_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        kitchen_id INT NOT NULL,
        role_id INT NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES kitchen_users(id) ON DELETE CASCADE,
        FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES kitchen_roles(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_kitchen (user_id, kitchen_id)
      )
    `);

    // Create kitchen_sessions table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS kitchen_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        selected_kitchen_id INT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES kitchen_users(id) ON DELETE CASCADE,
        FOREIGN KEY (selected_kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE
      )
    `);

    // Create orders table (if not exists)
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        delivery_address TEXT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('received', 'preparing', 'packing', 'ready', 'dispatched', 'completed', 'cancelled') DEFAULT 'received',
        priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
        kitchen_id INT,
        assigned_to INT,
        estimated_completion_time TIMESTAMP NULL,
        actual_completion_time TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (kitchen_id) REFERENCES kitchens(id),
        FOREIGN KEY (assigned_to) REFERENCES kitchen_users(id)
      )
    `);

    // Create order_items table (if not exists)
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        flavor_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // Create batches table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        kitchen_id INT NOT NULL,
        status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
        created_by INT NOT NULL,
        assigned_to INT,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        estimated_completion_time TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (kitchen_id) REFERENCES kitchens(id),
        FOREIGN KEY (created_by) REFERENCES kitchen_users(id),
        FOREIGN KEY (assigned_to) REFERENCES kitchen_users(id)
      )
    `);

    // Create batch_items table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS batch_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        flavor_id INT NOT NULL,
        quantity INT NOT NULL,
        status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // Insert default zones
    await databaseService.query(`
      INSERT IGNORE INTO zones (name, description) VALUES 
      ('Zone A', 'Primary delivery zone'),
      ('Zone B', 'Secondary delivery zone'),
      ('Zone C', 'Extended delivery zone')
    `);

    // Insert default roles
    await databaseService.query(`
      INSERT IGNORE INTO kitchen_roles (name, description) VALUES 
      ('Kitchen Manager', 'Full kitchen management access'),
      ('Kitchen Staff', 'Basic kitchen operations'),
      ('Kitchen Supervisor', 'Supervisory kitchen access')
    `);

    // Insert default permissions for Kitchen Manager
    const managerRole = await databaseService.query('SELECT id FROM kitchen_roles WHERE name = "Kitchen Manager" LIMIT 1');
    if (managerRole.length > 0) {
      const managerRoleId = managerRole[0].id;
      await databaseService.query(`
        INSERT IGNORE INTO role_permissions (role_id, permission_name, permission_value) VALUES 
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
      `, Array(13).fill(managerRoleId));
    }

    // Insert default permissions for Kitchen Staff
    const staffRole = await databaseService.query('SELECT id FROM kitchen_roles WHERE name = "Kitchen Staff" LIMIT 1');
    if (staffRole.length > 0) {
      const staffRoleId = staffRole[0].id;
      await databaseService.query(`
        INSERT IGNORE INTO role_permissions (role_id, permission_name, permission_value) VALUES 
        (?, 'orders', 'view'),
        (?, 'orders', 'update'),
        (?, 'batches', 'view'),
        (?, 'kitchen', 'view'),
        (?, 'notifications', 'view')
      `, Array(5).fill(staffRoleId));
    }

    console.log('Kitchen system database initialized successfully');

    return NextResponse.json({
      success: true,
      message: 'Kitchen system database initialized successfully'
    });

  } catch (error) {
    console.error('Error initializing kitchen database:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to initialize kitchen database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/init-kitchen-database
 * Check if kitchen system is initialized
 */
export async function GET(request: NextRequest) {
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
      'batch_items'
    ];

    const results = await Promise.all(
      tables.map(async (table) => {
        try {
          await databaseService.query(`SELECT 1 FROM ${table} LIMIT 1`);
          return { table, exists: true };
        } catch (error) {
          return { table, exists: false };
        }
      })
    );

    const existingTables = results.filter(r => r.exists).map(r => r.table);
    const missingTables = results.filter(r => !r.exists).map(r => r.table);

    return NextResponse.json({
      success: true,
      initialized: missingTables.length === 0,
      existing_tables: existingTables,
      missing_tables: missingTables
    });

  } catch (error) {
    console.error('Error checking kitchen database:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check kitchen database'
      },
      { status: 500 }
    );
  }
} 