const mysql = require('mysql2/promise');

async function checkTableStructure() {
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

    // Check product_instance_flavor table structure
    console.log('\n=== product_instance_flavor table structure ===');
    const [columns] = await connection.execute('DESCRIBE product_instance_flavor');
    columns.forEach(col => {
      console.log(`${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default} - ${col.Extra}`);
    });

    // Check order_items table structure
    console.log('\n=== order_items table structure ===');
    const [orderColumns] = await connection.execute('DESCRIBE order_items');
    orderColumns.forEach(col => {
      console.log(`${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default} - ${col.Extra}`);
    });

  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the check
checkTableStructure(); 