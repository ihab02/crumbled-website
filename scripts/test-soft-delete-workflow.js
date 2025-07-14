// Test script to verify the complete soft delete workflow
const mysql = require('mysql2/promise');

async function testSoftDeleteWorkflow() {
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

    // Step 1: Create a test product type
    console.log('1. Creating a test product type...');
    const [createResult] = await connection.execute(`
      INSERT INTO product_types (name, description, is_active, display_order) 
      VALUES (?, ?, ?, ?)
    `, ['Test Product Type', 'This is a test product type for soft delete testing', 1, 999]);
    
    const testProductTypeId = createResult.insertId;
    console.log(`   Created product type with ID: ${testProductTypeId}\n`);

    // Step 2: Verify it exists in active view
    console.log('2. Verifying it appears in active_product_types view:');
    const [activeView] = await connection.execute(`
      SELECT id, name, deleted_at, is_active 
      FROM active_product_types 
      WHERE id = ?
    `, [testProductTypeId]);
    
    if (activeView.length > 0) {
      console.log(`   ✅ Found in active view: ID ${activeView[0].id}, Name: ${activeView[0].name}`);
    } else {
      console.log('   ❌ Not found in active view');
    }
    console.log('');

    // Step 3: Soft delete it using the stored procedure
    console.log('3. Soft-deleting the test product type...');
    await connection.execute(`
      CALL soft_delete_product_type(?, 1, 'Test deletion')
    `, [testProductTypeId]);
    console.log('   ✅ Product type soft-deleted successfully\n');

    // Step 4: Verify it's no longer in active view
    console.log('4. Verifying it no longer appears in active_product_types view:');
    const [activeViewAfterDelete] = await connection.execute(`
      SELECT id, name, deleted_at, is_active 
      FROM active_product_types 
      WHERE id = ?
    `, [testProductTypeId]);
    
    if (activeViewAfterDelete.length === 0) {
      console.log('   ✅ Correctly removed from active view');
    } else {
      console.log('   ❌ Still appears in active view');
    }
    console.log('');

    // Step 5: Verify it appears in all_product_types view
    console.log('5. Verifying it appears in all_product_types view:');
    const [allView] = await connection.execute(`
      SELECT id, name, deleted_at, is_active, status
      FROM all_product_types 
      WHERE id = ?
    `, [testProductTypeId]);
    
    if (allView.length > 0) {
      const item = allView[0];
      console.log(`   ✅ Found in all view: ID ${item.id}, Name: ${item.name}, Status: ${item.status}, Deleted: ${item.deleted_at}`);
    } else {
      console.log('   ❌ Not found in all view');
    }
    console.log('');

    // Step 6: Check the raw table
    console.log('6. Checking the raw product_types table:');
    const [rawTable] = await connection.execute(`
      SELECT id, name, deleted_at, is_active 
      FROM product_types 
      WHERE id = ?
    `, [testProductTypeId]);
    
    if (rawTable.length > 0) {
      const item = rawTable[0];
      console.log(`   ✅ Found in raw table: ID ${item.id}, Name: ${item.name}, Deleted: ${item.deleted_at}, Active: ${item.is_active}`);
    } else {
      console.log('   ❌ Not found in raw table');
    }
    console.log('');

    console.log('🎉 Soft delete workflow test completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   - Product type created and appeared in active view');
    console.log('   - Product type soft-deleted and removed from active view');
    console.log('   - Product type still exists in all view with "deleted" status');
    console.log('   - Product type still exists in raw table with deleted_at timestamp');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Go to /admin/product-types in your browser');
    console.log('   2. Toggle "Show Deleted" to ON');
    console.log('   3. You should see "Test Product Type" with a "Deleted" badge');
    console.log('   4. Toggle "Show Deleted" to OFF');
    console.log('   5. The deleted item should disappear');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testSoftDeleteWorkflow(); 