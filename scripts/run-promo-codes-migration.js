const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration (same as in lib/db.ts)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Goodmorning@1',
  database: process.env.DB_NAME || 'crumbled_nextDB',
  multipleStatements: true // Allow multiple SQL statements
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting Promo Codes Migration');
    console.log(`Database: ${dbConfig.database} on ${dbConfig.host}`);
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established');
    
    // Read migration file
    const migrationFile = path.join(__dirname, '..', 'migrations', 'add_promo_codes.sql');
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }
    
    console.log(`📄 Reading migration file: ${migrationFile}`);
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    
    // Run migration
    console.log('🔧 Executing migration...');
    await connection.query(migrationSQL);
    console.log('✅ Migration executed successfully');
    
    // Verify migration
    console.log('🔍 Verifying migration...');
    const [tables] = await connection.query("SHOW TABLES LIKE 'promo_codes'");
    
    if (tables.length > 0) {
      console.log('✅ Promo codes table created successfully!');
      
      // Check if sample data was inserted
      const [promoCodes] = await connection.query('SELECT COUNT(*) as count FROM promo_codes');
      console.log(`📊 Found ${promoCodes[0].count} promo codes in the table`);
      
    } else {
      throw new Error('Promo codes table not found after migration');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('The promo codes system is now ready to use.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('You may need to restore from a backup if the database was partially modified.');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
runMigration(); 