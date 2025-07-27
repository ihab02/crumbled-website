const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkColumnTypes() {
  console.log('🔍 Checking popup_ads table column types...\n');
  
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✅ Database connection successful');
    
    // Check column types for target_pages and exclude_pages
    console.log('\n📋 Checking target_pages and exclude_pages columns:');
    const [columns] = await connection.execute(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'popup_ads' 
        AND COLUMN_NAME IN ('target_pages', 'exclude_pages')
      ORDER BY COLUMN_NAME
    `, [process.env.DB_NAME]);
    
    if (columns.length > 0) {
      columns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}:`);
        console.log(`    Type: ${col.DATA_TYPE}`);
        console.log(`    Nullable: ${col.IS_NULLABLE}`);
        console.log(`    Default: ${col.COLUMN_DEFAULT || 'NULL'}`);
        if (col.CHARACTER_MAXIMUM_LENGTH) {
          console.log(`    Max Length: ${col.CHARACTER_MAXIMUM_LENGTH}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ Columns not found!');
    }
    
    // Show the full table structure for reference
    console.log('📋 Full popup_ads table structure:');
    const [allColumns] = await connection.execute(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'popup_ads' 
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    allColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? '(NOT NULL)' : ''} ${col.COLUMN_DEFAULT ? `DEFAULT: ${col.COLUMN_DEFAULT}` : ''}`);
    });
    
    // Test JSON operations
    console.log('\n🧪 Testing JSON operations:');
    const [testData] = await connection.execute(`
      SELECT 
        id,
        title,
        target_pages,
        exclude_pages,
        CASE 
          WHEN target_pages IS NOT NULL THEN JSON_VALID(target_pages)
          ELSE NULL 
        END as target_pages_valid,
        CASE 
          WHEN exclude_pages IS NOT NULL THEN JSON_VALID(exclude_pages)
          ELSE NULL 
        END as exclude_pages_valid
      FROM popup_ads 
      LIMIT 3
    `);
    
    if (testData.length > 0) {
      testData.forEach(row => {
        console.log(`  - ID ${row.id} ("${row.title}"):`);
        console.log(`    Target pages: ${row.target_pages || 'NULL'} (Valid: ${row.target_pages_valid})`);
        console.log(`    Exclude pages: ${row.exclude_pages || 'NULL'} (Valid: ${row.exclude_pages_valid})`);
      });
    } else {
      console.log('  ⚠️ No data found in popup_ads table');
    }
    
    console.log('\n✅ Column type check completed!');
    
  } catch (error) {
    console.error('❌ Error checking column types:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the check
checkColumnTypes(); 