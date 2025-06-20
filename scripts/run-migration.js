const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Goodmorning@1',
    database: 'crumbled_nextDB',
    multipleStatements: true
  });

  try {
    console.log('Running flavors migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../schema/migrations/20240322_add_flavors_table.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    // Execute the migration
    await connection.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    // Verify the tables were created
    const [flavors] = await connection.query('SELECT * FROM flavors');
    console.log('Flavors in database:', flavors);
    
    const [images] = await connection.query('SELECT * FROM flavor_images');
    console.log('Flavor images in database:', images);
    
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await connection.end();
  }
}

runMigration(); 