const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  let connection;
  
  try {
    // Database configuration
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'crumbled_website',
      port: process.env.DB_PORT || 3306
    };

    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database successfully');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add_delivery_time_slot_to_orders.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔍 Applying migration: add_delivery_time_slot_to_orders.sql');
    console.log('📄 Migration content:');
    console.log(migrationSQL);

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`🔍 Executing: ${statement.substring(0, 50)}...`);
        await connection.execute(statement);
        console.log('✅ Statement executed successfully');
      }
    }

    console.log('🎉 Migration applied successfully!');
    console.log('✅ Added columns: delivery_time_slot_name, from_hour, to_hour to orders table');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Columns already exist, migration may have been applied before');
    } else if (error.code === 'ER_DUP_KEYNAME') {
      console.log('⚠️  Index already exists, migration may have been applied before');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  }); 