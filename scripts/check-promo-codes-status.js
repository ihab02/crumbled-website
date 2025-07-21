const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Goodmorning@1',
  database: 'crumbled_nextDB',
  multipleStatements: true
};

async function checkPromoCodesStatus() {
  let connection;
  
  try {
    console.log('🔍 Checking Promo Codes Database Status');
    console.log(`Database: ${dbConfig.database} on ${dbConfig.host}`);
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established');
    
    // Check if promo_codes table exists
    console.log('\n📋 Checking tables...');
    const [tables] = await connection.query("SHOW TABLES LIKE 'promo_codes'");
    
    if (tables.length > 0) {
      console.log('✅ promo_codes table exists');
      
      // Check table structure
      const [columns] = await connection.query("DESCRIBE promo_codes");
      console.log('\n📊 promo_codes table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Check existing data
      const [promoCodes] = await connection.query('SELECT * FROM promo_codes');
      console.log(`\n📦 Found ${promoCodes.length} promo codes:`);
      promoCodes.forEach(code => {
        console.log(`  - ${code.code}: ${code.name} (${code.discount_type} ${code.discount_value})`);
      });
      
    } else {
      console.log('❌ promo_codes table does not exist');
    }
    
    // Check if promo_code_usage table exists
    const [usageTables] = await connection.query("SHOW TABLES LIKE 'promo_code_usage'");
    
    if (usageTables.length > 0) {
      console.log('\n✅ promo_code_usage table exists');
      
      // Check table structure
      const [usageColumns] = await connection.query("DESCRIBE promo_code_usage");
      console.log('\n📊 promo_code_usage table structure:');
      usageColumns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Check existing data
      const [usageData] = await connection.query('SELECT COUNT(*) as count FROM promo_code_usage');
      console.log(`\n📦 Found ${usageData[0].count} usage records`);
      
    } else {
      console.log('\n❌ promo_code_usage table does not exist');
    }
    
    // Check if orders table has promo code columns
    console.log('\n🔍 Checking orders table for promo code columns...');
    const [orderColumns] = await connection.query("SHOW COLUMNS FROM orders LIKE 'promo_code%'");
    
    if (orderColumns.length > 0) {
      console.log('✅ Orders table has promo code columns:');
      orderColumns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type}`);
      });
    } else {
      console.log('❌ Orders table does not have promo code columns');
    }
    
    // Check indexes
    console.log('\n🔍 Checking indexes...');
    const [indexes] = await connection.query("SHOW INDEX FROM promo_codes");
    console.log(`Found ${indexes.length} indexes on promo_codes table`);
    
  } catch (error) {
    console.error('❌ Error checking status:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the check
checkPromoCodesStatus(); 