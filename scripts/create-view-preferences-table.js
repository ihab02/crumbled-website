const mysql = require('mysql2/promise');

async function createViewPreferencesTable() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });

    console.log('Connected to database');

    // Create admin_view_preferences table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS admin_view_preferences (
        id INT PRIMARY KEY AUTO_INCREMENT,
        admin_user_id INT NOT NULL,
        view_type ENUM('products', 'flavors', 'product_types', 'orders') NOT NULL,
        show_deleted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_admin_view (admin_user_id, view_type)
      )
    `;

    await connection.execute(createTableSQL);
    console.log('✅ admin_view_preferences table created successfully');

    // Insert default preferences for existing admin users
    const insertDefaultsSQL = `
      INSERT INTO admin_view_preferences (admin_user_id, view_type, show_deleted)
      SELECT id, 'products', false FROM admin_users
      ON DUPLICATE KEY UPDATE show_deleted = false
    `;

    await connection.execute(insertDefaultsSQL);
    console.log('✅ Default preferences inserted for products');

    const insertFlavorsSQL = `
      INSERT INTO admin_view_preferences (admin_user_id, view_type, show_deleted)
      SELECT id, 'flavors', false FROM admin_users
      ON DUPLICATE KEY UPDATE show_deleted = false
    `;

    await connection.execute(insertFlavorsSQL);
    console.log('✅ Default preferences inserted for flavors');

    const insertProductTypesSQL = `
      INSERT INTO admin_view_preferences (admin_user_id, view_type, show_deleted)
      SELECT id, 'product_types', false FROM admin_users
      ON DUPLICATE KEY UPDATE show_deleted = false
    `;

    await connection.execute(insertProductTypesSQL);
    console.log('✅ Default preferences inserted for product_types');

    const insertOrdersSQL = `
      INSERT INTO admin_view_preferences (admin_user_id, view_type, show_deleted)
      SELECT id, 'orders', false FROM admin_users
      ON DUPLICATE KEY UPDATE show_deleted = false
    `;

    await connection.execute(insertOrdersSQL);
    console.log('✅ Default preferences inserted for orders');

    console.log('🎉 All done! admin_view_preferences table is ready.');

  } catch (error) {
    console.error('❌ Error creating admin_view_preferences table:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
createViewPreferencesTable(); 