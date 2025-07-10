const mysql = require('mysql2/promise');

async function fixOrderMigration() {
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

    // Step 1: Add columns to order_items table
    console.log('Adding columns to order_items table...');
    await connection.execute(`
      ALTER TABLE order_items 
      ADD COLUMN product_name VARCHAR(255) NULL AFTER product_instance_id,
      ADD COLUMN product_type ENUM('individual', 'pack') NULL AFTER product_name,
      ADD COLUMN pack_size VARCHAR(50) NULL AFTER product_type,
      ADD COLUMN flavor_details JSON NULL AFTER pack_size
    `);
    console.log('✅ Added columns to order_items');

    // Step 2: Add columns to product_instance_flavor table
    console.log('Adding columns to product_instance_flavor table...');
    await connection.execute(`
      ALTER TABLE product_instance_flavor 
      ADD COLUMN flavor_name VARCHAR(255) NULL AFTER flavor_id,
      ADD COLUMN size_name VARCHAR(50) NULL AFTER flavor_name
    `);
    console.log('✅ Added columns to product_instance_flavor');

    // Step 3: Create indexes
    console.log('Creating indexes...');
    await connection.execute('CREATE INDEX idx_order_items_product_name ON order_items(product_name)');
    await connection.execute('CREATE INDEX idx_order_items_product_type ON order_items(product_type)');
    await connection.execute('CREATE INDEX idx_product_instance_flavor_flavor_name ON product_instance_flavor(flavor_name)');
    console.log('✅ Created indexes');

    console.log('✅ Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
fixOrderMigration(); 