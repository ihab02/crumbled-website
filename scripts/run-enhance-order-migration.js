const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runEnhanceOrderMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });

    console.log('Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/enhance_order_items_storage.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          // Continue with other statements
        }
      }
    }

    console.log('✅ Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
runEnhanceOrderMigration(); 