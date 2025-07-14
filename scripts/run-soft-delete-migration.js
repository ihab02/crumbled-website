const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSoftDeleteMigration() {
  let connection;
  
  try {
    console.log('Starting soft delete views migration...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB',
      multipleStatements: true
    });
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/add_soft_delete_views.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Migration file loaded successfully');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip DELIMITER statements and empty statements
      if (statement.startsWith('DELIMITER') || statement.trim() === '') {
        continue;
      }
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 100)}...`);
        await connection.execute(statement);
      } catch (error) {
        // Check if it's a "table already exists" error (safe to ignore)
        if (error.message.includes('already exists')) {
          console.log(`Table/view already exists, skipping: ${statement.substring(0, 50)}...`);
          continue;
        }
        
        // Check if it's a "column already exists" error (safe to ignore)
        if (error.message.includes('Duplicate column name')) {
          console.log(`Column already exists, skipping: ${statement.substring(0, 50)}...`);
          continue;
        }
        
        // Check if it's a "constraint already exists" error (safe to ignore)
        if (error.message.includes('Duplicate key name') || error.message.includes('Duplicate foreign key constraint name')) {
          console.log(`Constraint already exists, skipping: ${statement.substring(0, 50)}...`);
          continue;
        }
        
        // Check if it's a "procedure already exists" error (safe to ignore)
        if (error.message.includes('procedure already exists')) {
          console.log(`Procedure already exists, skipping: ${statement.substring(0, 50)}...`);
          continue;
        }
        
        console.error(`Error executing statement ${i + 1}:`, error);
        throw error;
      }
    }
    
    console.log('Soft delete views migration completed successfully!');
    
    // Verify the migration by checking if views exist
    const viewsToCheck = [
      'active_products',
      'all_products', 
      'active_flavors',
      'all_flavors',
      'active_product_types',
      'all_product_types',
      'active_product_instances',
      'all_product_instances'
    ];
    
    console.log('\nVerifying views...');
    for (const viewName of viewsToCheck) {
      try {
        await connection.execute(`SELECT 1 FROM ${viewName} LIMIT 1`);
        console.log(`✅ ${viewName} - exists`);
      } catch (error) {
        console.log(`❌ ${viewName} - missing: ${error.message}`);
      }
    }
    
    // Check if admin_view_preferences table exists
    try {
      await connection.execute('SELECT 1 FROM admin_view_preferences LIMIT 1');
      console.log('✅ admin_view_preferences - exists');
    } catch (error) {
      console.log(`❌ admin_view_preferences - missing: ${error.message}`);
    }
    
    // Test the views with actual data
    console.log('\nTesting views with data...');
    
    try {
      const [activeProducts] = await connection.execute('SELECT COUNT(*) as count FROM active_products');
      console.log(`Active products: ${activeProducts[0].count}`);
    } catch (error) {
      console.log(`Error testing active_products: ${error.message}`);
    }
    
    try {
      const [allProducts] = await connection.execute('SELECT COUNT(*) as count FROM all_products');
      console.log(`All products: ${allProducts[0].count}`);
    } catch (error) {
      console.log(`Error testing all_products: ${error.message}`);
    }
    
    console.log('\nMigration verification completed!');
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
runSoftDeleteMigration(); 