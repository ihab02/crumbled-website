// Script to restore a soft-deleted product type
const mysql = require('mysql2/promise');

async function restoreProductType() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });

    console.log('Connected to database successfully\n');

    // Restore Large Dessert (ID 1)
    console.log('Restoring Large Dessert (ID 1)...');
    await connection.execute(`
      CALL restore_product_type(1, 1)
    `);
    console.log('✅ Large Dessert restored successfully!\n');

    // Verify it's back in active view
    console.log('Verifying Large Dessert is back in active view:');
    const [activeView] = await connection.execute(`
      SELECT id, name, deleted_at, is_active 
      FROM active_product_types 
      WHERE name = 'Large Dessert'
    `);
    
    if (activeView.length > 0) {
      console.log(`   ✅ Found in active view: ID ${activeView[0].id}, Name: ${activeView[0].name}`);
    } else {
      console.log('   ❌ Not found in active view');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

restoreProductType(); 