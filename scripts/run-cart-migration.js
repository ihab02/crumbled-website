const mysql = require('mysql2/promise');

async function runCartMigration() {
  let connection;
  
  try {
    console.log('Starting cart schema migration...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'crumbled_nextDB'
    });
    
    // Add is_pack column to cart_items table
    console.log('Adding is_pack column to cart_items table...');
    try {
      await connection.execute(`
        ALTER TABLE cart_items ADD COLUMN is_pack TINYINT(1) NOT NULL DEFAULT 0
      `);
      console.log('✓ Added is_pack column to cart_items');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('Note: is_pack column already exists in cart_items');
      } else {
        throw error;
      }
    }
    
    // Add size column to cart_item_flavors table
    console.log('Adding size column to cart_item_flavors table...');
    try {
      await connection.execute(`
        ALTER TABLE cart_item_flavors ADD COLUMN size ENUM('Mini', 'Medium', 'Large') NOT NULL DEFAULT 'Large'
      `);
      console.log('✓ Added size column to cart_item_flavors');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('Note: size column already exists in cart_item_flavors');
      } else {
        throw error;
      }
    }
    
    // Update existing cart items to set is_pack based on product type
    console.log('Updating existing cart items...');
    try {
      await connection.execute(`
        UPDATE cart_items ci 
        JOIN products p ON ci.product_id = p.id 
        SET ci.is_pack = p.is_pack 
        WHERE ci.is_pack = 0
      `);
      console.log('✓ Updated existing cart items');
    } catch (error) {
      console.log('Note: Could not update existing cart items:', error.message);
    }
    
    // Show the updated table structures
    console.log('\nUpdated table structures:');
    
    const [cartItemsStructure] = await connection.execute('DESCRIBE cart_items');
    console.log('\ncart_items table:');
    console.table(cartItemsStructure);
    
    const [cartItemFlavorsStructure] = await connection.execute('DESCRIBE cart_item_flavors');
    console.log('\ncart_item_flavors table:');
    console.table(cartItemFlavorsStructure);
    
    console.log('\n✅ Cart schema migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

runCartMigration(); 