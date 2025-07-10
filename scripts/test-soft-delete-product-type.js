// Test script to soft-delete a product type and verify the toggle works
const mysql = require('mysql2/promise');

async function testSoftDeleteProductType() {
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

    // Step 1: Check current state
    console.log('1. Current product types:');
    const [currentTypes] = await connection.execute(`
      SELECT id, name, deleted_at, is_active 
      FROM product_types 
      ORDER BY id
    `);
    
    currentTypes.forEach(pt => {
      console.log(`  ID: ${pt.id}, Name: ${pt.name}, Deleted: ${pt.deleted_at}, Active: ${pt.is_active}`);
    });
    console.log('');

    // Step 2: Soft delete the first product type (ID 1)
    console.log('2. Soft-deleting product type ID 1 (Large Dessert)...');
    await connection.execute(`
      UPDATE product_types 
      SET deleted_at = CURRENT_TIMESTAMP,
          deleted_by = 1,
          deletion_reason = 'Test deletion'
      WHERE id = 1
    `);
    console.log('Product type soft-deleted successfully!\n');

    // Step 3: Check the updated state
    console.log('3. Updated product types:');
    const [updatedTypes] = await connection.execute(`
      SELECT id, name, deleted_at, is_active 
      FROM product_types 
      ORDER BY id
    `);
    
    updatedTypes.forEach(pt => {
      console.log(`  ID: ${pt.id}, Name: ${pt.name}, Deleted: ${pt.deleted_at}, Active: ${pt.is_active}`);
    });
    console.log('');

    // Step 4: Test the views
    console.log('4. Testing active_product_types view (should NOT show deleted):');
    const [activeView] = await connection.execute(`
      SELECT id, name, deleted_at, is_active 
      FROM active_product_types 
      ORDER BY id
    `);
    
    activeView.forEach(pt => {
      console.log(`  ID: ${pt.id}, Name: ${pt.name}, Deleted: ${pt.deleted_at}, Active: ${pt.is_active}`);
    });
    console.log('');

    console.log('5. Testing all_product_types view (should show ALL including deleted):');
    const [allView] = await connection.execute(`
      SELECT id, name, deleted_at, is_active, status
      FROM all_product_types 
      ORDER BY id
    `);
    
    allView.forEach(pt => {
      console.log(`  ID: ${pt.id}, Name: ${pt.name}, Deleted: ${pt.deleted_at}, Active: ${pt.is_active}, Status: ${pt.status}`);
    });
    console.log('');

    console.log('✅ Test completed! Now try toggling "Show Deleted" in the admin UI.');
    console.log('   You should see "Large Dessert" appear with a "Deleted" badge when toggled on.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testSoftDeleteProductType(); 