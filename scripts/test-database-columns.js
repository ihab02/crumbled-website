const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabaseColumns() {
  console.log('🧪 Testing Database Column Types...\n');
  
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
    
    // Test 1: Check current column types
    console.log('\n📋 Test 1: Checking current column types...');
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
    
    console.log('📊 Current column types:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? '(NOT NULL)' : ''} ${col.COLUMN_DEFAULT ? `DEFAULT: ${col.COLUMN_DEFAULT}` : ''}`);
    });
    
    // Test 2: Check if columns are JSON type
    const jsonColumns = columns.filter(col => col.DATA_TYPE === 'json');
    if (jsonColumns.length > 0) {
      console.log('\n⚠️ Found JSON columns that might cause issues:');
      jsonColumns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} is JSON type`);
      });
      
      console.log('\n🔧 Recommendation: Change JSON columns to TEXT type');
      console.log('Run the migration: migrations/simple_fix_json_columns.sql');
    } else {
      console.log('\n✅ No JSON columns found - column types look good');
    }
    
    // Test 3: Test JSON operations
    console.log('\n🧪 Test 3: Testing JSON operations...');
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
    
    console.log('📊 JSON validation results:');
    testData.forEach(row => {
      console.log(`  - ID ${row.id}: "${row.title}"`);
      console.log(`    Target pages: ${row.target_pages || 'null'} (valid: ${row.target_pages_valid})`);
      console.log(`    Exclude pages: ${row.exclude_pages || 'null'} (valid: ${row.exclude_pages_valid})`);
    });
    
    // Test 4: Test JSON parsing
    console.log('\n🔍 Test 4: Testing JSON parsing...');
    const [parsedData] = await connection.execute(`
      SELECT 
        id,
        title,
        target_pages,
        exclude_pages,
        CASE 
          WHEN target_pages IS NOT NULL AND JSON_VALID(target_pages) 
          THEN JSON_EXTRACT(target_pages, '$[0]')
          ELSE NULL 
        END as first_target_page,
        CASE 
          WHEN exclude_pages IS NOT NULL AND JSON_VALID(exclude_pages) 
          THEN JSON_EXTRACT(exclude_pages, '$[0]')
          ELSE NULL 
        END as first_exclude_page
      FROM popup_ads 
      WHERE is_active = 1
      LIMIT 3
    `);
    
    console.log('📊 JSON parsing results:');
    parsedData.forEach(row => {
      console.log(`  - ID ${row.id}: "${row.title}"`);
      console.log(`    First target page: ${row.first_target_page || 'null'}`);
      console.log(`    First exclude page: ${row.first_exclude_page || 'null'}`);
    });
    
    // Test 5: Test UPDATE operation
    console.log('\n🔄 Test 5: Testing UPDATE operation...');
    const testUpdateData = {
      target_pages: JSON.stringify(['/test-page-1', '/test-page-2']),
      exclude_pages: JSON.stringify(['/admin', '/private'])
    };
    
    try {
      const [updateResult] = await connection.execute(`
        UPDATE popup_ads 
        SET target_pages = ?, exclude_pages = ?
        WHERE id = (SELECT id FROM popup_ads LIMIT 1)
      `, [testUpdateData.target_pages, testUpdateData.exclude_pages]);
      
      console.log(`✅ UPDATE test successful: ${updateResult.affectedRows} rows affected`);
      
      // Verify the update
      const [verifyResult] = await connection.execute(`
        SELECT id, target_pages, exclude_pages
        FROM popup_ads 
        WHERE target_pages = ? AND exclude_pages = ?
        LIMIT 1
      `, [testUpdateData.target_pages, testUpdateData.exclude_pages]);
      
      if (verifyResult.length > 0) {
        console.log('✅ UPDATE verification successful');
        console.log(`  - Target pages: ${verifyResult[0].target_pages}`);
        console.log(`  - Exclude pages: ${verifyResult[0].exclude_pages}`);
      } else {
        console.log('⚠️ UPDATE verification failed - data not found');
      }
      
    } catch (updateError) {
      console.error('❌ UPDATE test failed:', updateError.message);
    }
    
    // Test 6: Check MySQL version
    console.log('\n🔍 Test 6: Checking MySQL version...');
    const [versionResult] = await connection.execute('SELECT VERSION() as version');
    console.log(`📊 MySQL version: ${versionResult[0].version}`);
    
    // Check JSON support
    const [jsonSupport] = await connection.execute(`
      SELECT 
        JSON_VALID('["test"]') as json_valid_test,
        JSON_EXTRACT('["test"]', '$[0]') as json_extract_test
    `);
    
    console.log(`📊 JSON support test:`);
    console.log(`  - JSON_VALID: ${jsonSupport[0].json_valid_test}`);
    console.log(`  - JSON_EXTRACT: ${jsonSupport[0].json_extract_test}`);
    
    console.log('\n🎉 Database Column Test Complete!');
    console.log('\n📋 Summary:');
    if (jsonColumns.length > 0) {
      console.log('  ⚠️ JSON columns detected - consider changing to TEXT');
      console.log('  📝 Run: migrations/simple_fix_json_columns.sql');
    } else {
      console.log('  ✅ Column types look good');
    }
    console.log('  ✅ JSON operations working');
    console.log('  ✅ UPDATE operations working');
    
  } catch (error) {
    console.error('❌ Error testing database columns:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testDatabaseColumns(); 