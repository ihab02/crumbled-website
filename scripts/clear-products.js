const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Goodmorning@1',
  database: 'crumbled_nextDB',
});

async function clearProducts() {
  console.log('Starting clearProducts script...');
  try {
    console.log('Connecting to database...');
    await connection.query('DELETE FROM cookie_flavor_image');
    await connection.query('DELETE FROM cookie_flavor');
    console.log('Products cleared successfully');
  } catch (error) {
    console.error('Error clearing products:', error);
  } finally {
    await connection.end();
    console.log('Database connection closed.');
  }
}

clearProducts(); 