const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });

    console.log('Running size-specific stock migration...');

    // Add size-specific stock fields to flavors table
    await connection.query(`
      ALTER TABLE flavors 
      ADD COLUMN stock_quantity_mini INT DEFAULT 0,
      ADD COLUMN stock_quantity_medium INT DEFAULT 0,
      ADD COLUMN stock_quantity_large INT DEFAULT 0
    `);
    console.log('Added size-specific stock fields to flavors table');

    // Migrate existing stock_quantity to large size
    await connection.query(`
      UPDATE flavors SET stock_quantity_large = stock_quantity WHERE stock_quantity IS NOT NULL
    `);
    console.log('Migrated existing stock to large size');

    // Set default stock for all sizes
    await connection.query(`
      UPDATE flavors SET stock_quantity_mini = 100 WHERE stock_quantity_mini IS NULL
    `);
    await connection.query(`
      UPDATE flavors SET stock_quantity_medium = 100 WHERE stock_quantity_medium IS NULL
    `);
    await connection.query(`
      UPDATE flavors SET stock_quantity_large = 100 WHERE stock_quantity_large IS NULL
    `);
    console.log('Set default stock for all sizes');

    // Add size column to stock_history table
    await connection.query(`
      ALTER TABLE stock_history 
      ADD COLUMN size ENUM('mini', 'medium', 'large') DEFAULT 'large' AFTER item_type
    `);
    console.log('Added size column to stock_history table');

    // Update existing stock history records
    await connection.query(`
      UPDATE stock_history SET size = 'large' WHERE size IS NULL
    `);
    console.log('Updated existing stock history records');

    // Add indexes
    await connection.query(`
      CREATE INDEX idx_flavors_stock_sizes ON flavors(stock_quantity_mini, stock_quantity_medium, stock_quantity_large, is_available, is_enabled)
    `);
    await connection.query(`
      CREATE INDEX idx_stock_history_size ON stock_history(item_id, item_type, size, changed_at)
    `);
    console.log('Added indexes for better performance');

    console.log('Size-specific stock migration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration(); 