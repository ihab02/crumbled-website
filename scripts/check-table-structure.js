const mysql = require('mysql2/promise');

async function checkTableStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Goodmorning@1',
    database: 'crumbled_nextDB'
  });

  try {
    console.log('🔍 Checking popup_ads table structure...\n');

    // Get table structure
    const [columns] = await connection.execute(`
      DESCRIBE popup_ads
    `);

    console.log('📋 Table columns:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} (${col.Type}) - Null: ${col.Null} - Default: ${col.Default} - Extra: ${col.Extra}`);
    });

    console.log(`\n📊 Total columns: ${columns.length}`);

    // Count the columns that should be in INSERT (excluding id, created_at, updated_at)
    const insertColumns = columns.filter(col => 
      !['id', 'created_at', 'updated_at'].includes(col.Field)
    );
    
    console.log(`📊 Columns for INSERT: ${insertColumns.length}`);
    console.log('📋 INSERT columns:');
    insertColumns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field}`);
    });

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await connection.end();
  }
}

checkTableStructure(); 