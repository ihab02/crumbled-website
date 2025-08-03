const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'crumbled_website',
  port: process.env.DB_PORT || 3306
};

async function applyMigration() {
  let connection;
  
  try {
    console.log('🔍 [DEBUG] Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/add_expected_delivery_date_to_orders.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔍 [DEBUG] Migration SQL:');
    console.log(migrationSQL);
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('🔍 [DEBUG] Executing migration statements...');
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`🔍 [DEBUG] Executing: ${statement.substring(0, 50)}...`);
        await connection.execute(statement);
        console.log('✅ Statement executed successfully');
      }
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the column was added
    console.log('🔍 [DEBUG] Verifying column was added...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'expected_delivery_date'
    `, [dbConfig.database]);
    
    if (columns.length > 0) {
      console.log('✅ expected_delivery_date column verified:', columns[0]);
    } else {
      console.log('❌ expected_delivery_date column not found');
    }
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔍 [DEBUG] Database connection closed');
    }
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }); 