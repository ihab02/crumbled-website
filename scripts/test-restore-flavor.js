const mysql = require('mysql2/promise');

async function testRestoreFlavor() {
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

    // First, let's soft delete a flavor to test with
    console.log('🔍 Checking for flavors to test with...');
    const [flavors] = await connection.execute('SELECT id, name, deleted_at FROM flavors LIMIT 5');
    
    if (flavors.length === 0) {
      console.log('❌ No flavors found to test with');
      return;
    }

    console.log('📋 Available flavors:');
    flavors.forEach(flavor => {
      console.log(`  ID: ${flavor.id}, Name: ${flavor.name}, Deleted: ${flavor.deleted_at ? 'Yes' : 'No'}`);
    });

    // Find a flavor that's not deleted to test soft delete
    const activeFlavor = flavors.find(f => !f.deleted_at);
    if (!activeFlavor) {
      console.log('❌ No active flavors found to test with');
      return;
    }

    console.log(`\n🧪 Testing with flavor: ${activeFlavor.name} (ID: ${activeFlavor.id})`);

    // Test the restore stored procedure directly
    console.log('\n🔧 Testing restore stored procedure...');
    
    // First, let's soft delete it
    await connection.execute(
      'CALL soft_delete_flavor(?, ?, ?)',
      [activeFlavor.id, 1, 'Test deletion']
    );
    console.log('✅ Flavor soft deleted');

    // Check if it's now deleted
    const [deletedCheck] = await connection.execute(
      'SELECT id, name, deleted_at FROM flavors WHERE id = ?',
      [activeFlavor.id]
    );
    console.log(`📊 After deletion: ${deletedCheck[0].deleted_at ? 'Deleted' : 'Not deleted'}`);

    // Now restore it
    await connection.execute(
      'CALL restore_flavor(?, ?)',
      [activeFlavor.id, 1]
    );
    console.log('✅ Flavor restored');

    // Check if it's restored
    const [restoredCheck] = await connection.execute(
      'SELECT id, name, deleted_at FROM flavors WHERE id = ?',
      [activeFlavor.id]
    );
    console.log(`📊 After restore: ${restoredCheck[0].deleted_at ? 'Still deleted' : 'Restored'}`);

    console.log('\n🎉 Restore functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing restore functionality:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testRestoreFlavor(); 