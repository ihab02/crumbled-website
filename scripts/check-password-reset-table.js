const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPasswordResetTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Goodmorning@1',
    database: process.env.DB_NAME || 'crumbled_nextDB'
  });

  try {
    console.log('Connected to database\n');

    // Check if password_reset_tokens table exists
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'crumbled_nextDB'}' 
      AND TABLE_NAME = 'password_reset_tokens'
    `);

    if (tables.length === 0) {
      console.log('❌ password_reset_tokens table does not exist!');
      return;
    }

    console.log('✅ password_reset_tokens table exists\n');

    // Get detailed table structure
    const [columns] = await connection.query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT, 
        COLUMN_KEY,
        COLUMN_TYPE,
        EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'crumbled_nextDB'}' 
      AND TABLE_NAME = 'password_reset_tokens'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('=== password_reset_tokens table structure ===');
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME} - ${col.COLUMN_TYPE} - ${col.IS_NULLABLE} - ${col.COLUMN_KEY} - Default: ${col.COLUMN_DEFAULT} - Extra: ${col.EXTRA}`);
    });

    // Check if there are any existing records
    const [records] = await connection.query('SELECT COUNT(*) as count FROM password_reset_tokens');
    console.log(`\n📊 Total records in password_reset_tokens: ${records[0].count}`);

    // Show a sample record if any exist
    if (records[0].count > 0) {
      const [sample] = await connection.query('SELECT * FROM password_reset_tokens LIMIT 1');
      console.log('\n📋 Sample record:');
      console.log(JSON.stringify(sample[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkPasswordResetTable().catch(console.error); 