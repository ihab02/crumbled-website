const mysql = require('mysql2/promise');

async function checkStructure() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });

    console.log('Checking flavors table structure...');

    // Check flavors table structure
    const [flavorColumns] = await connection.query(`
      DESCRIBE flavors
    `);
    console.log('Flavors table columns:');
    flavorColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check stock_history table structure
    const [historyColumns] = await connection.query(`
      DESCRIBE stock_history
    `);
    console.log('\nStock history table columns:');
    historyColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check sample flavor data
    const [sampleFlavor] = await connection.query(`
      SELECT id, name, stock_quantity, stock_quantity_mini, stock_quantity_medium, stock_quantity_large FROM flavors LIMIT 1
    `);
    console.log('\nSample flavor data:');
    console.log(sampleFlavor[0]);

  } catch (error) {
    console.error('Error checking structure:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkStructure(); 