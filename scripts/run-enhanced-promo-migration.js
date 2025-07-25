const pool = require('../lib/db').default;
const { readFileSync } = require('fs');
const { join } = require('path');

async function runEnhancedPromoMigration() {
  try {
    console.log('🔧 Running enhanced promo codes migration...');

    // Read the migration file
    const migrationPath = join(__dirname, '../migrations/add_enhanced_promo_codes_and_pricing_system.sql');
    const migrationContent = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');

    // Split SQL statements (handle both semicolon and GO separators)
    const statements = migrationContent
      .split(/;\s*\n|GO\s*\n/)
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
        console.log(`📝 Statement preview: ${statement.substring(0, 100)}...`);
        
        const connection = await pool.getConnection();
        try {
          await connection.execute(statement);
        } finally {
          connection.release();
        }
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        // Check if it's a "column already exists" error
        if (error.message.includes('Duplicate column name') || 
            error.message.includes('already exists') ||
            error.message.includes('Duplicate key name')) {
          console.log(`⚠️ Statement ${i + 1} skipped (already exists): ${error.message}`);
          continue;
        }
        
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        console.error(`📝 Failed statement: ${statement}`);
        throw error;
      }
    }

    console.log('🎉 Enhanced promo codes migration completed successfully!');
    console.log('✅ The enhanced_type column and other enhanced fields have been added to the promo_codes table');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    try {
      await pool.end();
      console.log('🔌 Database connection closed');
    } catch (error) {
      console.error('⚠️ Error closing database connection:', error);
    }
  }
}

// Run the migration
runEnhancedPromoMigration(); 