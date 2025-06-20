const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkFlavors() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Checking flavors table...');
    
    // Check if flavors table exists
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'flavors'
    `, [process.env.DB_NAME]);
    
    if (tables.length === 0) {
      console.log('Flavors table does not exist!');
      return;
    }

    // Get count of flavors
    const [count] = await connection.query('SELECT COUNT(*) as count FROM flavors');
    console.log('Total flavors:', count[0].count);

    // Get all flavors
    const [flavors] = await connection.query('SELECT * FROM flavors');
    console.log('Flavors:', flavors);

    // Check flavor_images table
    const [images] = await connection.query('SELECT * FROM flavor_images');
    console.log('Flavor images:', images);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkFlavors(); 