const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixLocalColumns() {
  console.log('🔧 Fixing local database column types...\n');
  
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
    
    // Check current column types
    console.log('\n📋 Current column types:');
    const [currentColumns] = await connection.execute(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'popup_ads' 
        AND COLUMN_NAME IN ('target_pages', 'exclude_pages')
      ORDER BY COLUMN_NAME
    `, [process.env.DB_NAME]);
    
    currentColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
    });
    
    // Fix the columns by changing from JSON to TEXT
    console.log('\n🔧 Changing column types from JSON to TEXT...');
    
    await connection.execute(`
      ALTER TABLE popup_ads 
      MODIFY COLUMN target_pages TEXT DEFAULT NULL
    `);
    console.log('✅ Changed target_pages from JSON to TEXT');
    
    await connection.execute(`
      ALTER TABLE popup_ads 
      MODIFY COLUMN exclude_pages TEXT DEFAULT NULL
    `);
    console.log('✅ Changed exclude_pages from JSON to TEXT');
    
    // Verify the changes
    console.log('\n📋 New column types:');
    const [newColumns] = await connection.execute(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'popup_ads' 
        AND COLUMN_NAME IN ('target_pages', 'exclude_pages')
      ORDER BY COLUMN_NAME
    `, [process.env.DB_NAME]);
    
    newColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
    });
    
    // Test JSON operations still work
    console.log('\n🧪 Testing JSON operations with new column types:');
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
    }
    
    console.log('\n✅ Local database column types fixed!');
    console.log('📝 Now your local database matches what production should have.');
    console.log('🚀 You can now deploy the same fix to production.');
    
  } catch (error) {
    console.error('❌ Error fixing column types:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the fix
fixLocalColumns(); 