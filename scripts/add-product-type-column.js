const mysql = require('mysql2/promise');

async function addProductTypeColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });

    console.log('Connected to database');

    // Add product_type column
    console.log('Adding product_type column to order_items...');
    await connection.execute(`
      ALTER TABLE order_items 
      ADD COLUMN product_type ENUM('individual', 'pack') NULL AFTER product_name
    `);
    console.log('✅ Added product_type column');

    console.log('✅ Column added successfully');

  } catch (error) {
    console.error('❌ Failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
addProductTypeColumn(); 