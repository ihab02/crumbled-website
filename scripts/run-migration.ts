const { databaseService } = require('../lib/services/databaseService');
const { readFileSync } = require('fs');
const { join } = require('path');

async function runMigration(): Promise<void> {
  try {
    console.log('Running product types migration...');

    // Read the migration file
    const migrationFile = readFileSync(
      join(__dirname, '../schema/migrations/20240320_add_product_types.sql'),
      'utf8'
    );

    // Split SQL statements
    const statements: string[] = migrationFile
      .split(';')
      .map((statement: string) => statement.trim())
      .filter((statement: string) => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        await databaseService.query(statement);
        console.log('Executed:', statement.slice(0, 100) + '...');
      } catch (error) {
        console.error('Error executing statement:', error);
        console.error('Statement:', statement);
        throw error;
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 