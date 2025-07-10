const mysql = require('mysql2/promise');

async function testRestoreAPI() {
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

    // Find a deleted flavor to test with
    console.log('🔍 Looking for deleted flavors...');
    const [deletedFlavors] = await connection.execute(
      'SELECT id, name, deleted_at FROM flavors WHERE deleted_at IS NOT NULL LIMIT 3'
    );
    
    if (deletedFlavors.length === 0) {
      console.log('❌ No deleted flavors found. Creating one for testing...');
      
      // Soft delete a flavor for testing
      const [activeFlavors] = await connection.execute(
        'SELECT id, name FROM flavors WHERE deleted_at IS NULL LIMIT 1'
      );
      
      if (activeFlavors.length === 0) {
        console.log('❌ No active flavors found either');
        return;
      }
      
      const testFlavor = activeFlavors[0];
      await connection.execute(
        'CALL soft_delete_flavor(?, ?, ?)',
        [testFlavor.id, 1, 'Test deletion for API testing']
      );
      console.log(`✅ Soft deleted flavor: ${testFlavor.name} (ID: ${testFlavor.id})`);
      
      deletedFlavors.push({ id: testFlavor.id, name: testFlavor.name, deleted_at: new Date() });
    }

    console.log('📋 Deleted flavors found:');
    deletedFlavors.forEach(flavor => {
      console.log(`  ID: ${flavor.id}, Name: ${flavor.name}, Deleted: ${flavor.deleted_at}`);
    });

    // Test the restore stored procedure directly
    const testFlavor = deletedFlavors[0];
    console.log(`\n🧪 Testing restore for: ${testFlavor.name} (ID: ${testFlavor.id})`);
    
    // Restore the flavor
    await connection.execute(
      'CALL restore_flavor(?, ?)',
      [testFlavor.id, 1]
    );
    console.log('✅ Flavor restored via stored procedure');

    // Verify restoration
    const [restoredCheck] = await connection.execute(
      'SELECT id, name, deleted_at FROM flavors WHERE id = ?',
      [testFlavor.id]
    );
    
    if (restoredCheck[0].deleted_at) {
      console.log('❌ Flavor is still marked as deleted');
    } else {
      console.log('✅ Flavor successfully restored - no longer marked as deleted');
    }

    console.log('\n🎉 Restore API test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing restore API:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testRestoreAPI(); 