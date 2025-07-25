const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/add_enhanced_promo_code_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Add your password here if needed
      database: 'crumbled_website'
    });
    
    console.log('🔧 Running enhanced promo code migration...');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await connection.execute(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Some fields already exist, this is normal if migration was run before.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration().catch(console.error); 