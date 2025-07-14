const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runAgeGroupEmailMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Goodmorning@1',
    database: process.env.DB_NAME || 'crumbled_nextDB',
    multipleStatements: true
  });

  try {
    console.log('Running Age Group and Email Verification migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/add_customer_age_group_and_email_verification.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    console.log('Migration SQL loaded successfully');
    
    // Execute the migration
    await connection.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    // Verify the changes were applied
    console.log('\nVerifying migration results...');
    
    // Check if age_group column was added
    const [customerColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'crumbled_nextDB'}' 
      AND TABLE_NAME = 'customers' 
      AND COLUMN_NAME IN ('age_group', 'birth_date', 'email_verified')
    `);
    
    console.log('Customer table new columns:', customerColumns);
    
    // Check if email_verification_tokens table was created
    const [emailVerificationTable] = await connection.query(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'crumbled_nextDB'}' 
      AND TABLE_NAME = 'email_verification_tokens'
    `);
    
    console.log('Email verification tokens table:', emailVerificationTable);
    
    // Check if password_reset_tokens table was created
    const [passwordResetTable] = await connection.query(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'crumbled_nextDB'}' 
      AND TABLE_NAME = 'password_reset_tokens'
    `);
    
    console.log('Password reset tokens table:', passwordResetTable);
    
    // Check indexes
    const [indexes] = await connection.query(`
      SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'crumbled_nextDB'}' 
      AND TABLE_NAME IN ('customers', 'email_verification_tokens', 'password_reset_tokens')
      ORDER BY TABLE_NAME, INDEX_NAME
    `);
    
    console.log('New indexes created:', indexes);
    
    console.log('\n✅ Migration verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runAgeGroupEmailMigration().catch(console.error); 