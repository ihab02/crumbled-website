const mysql = require('mysql2/promise');

async function checkFlavorImages() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });
    const [rows] = await connection.execute('SELECT id, flavor_id, image_url FROM flavor_images LIMIT 20');
    if (rows.length === 0) {
      console.log('No entries found in flavor_images table.');
    } else {
      console.log('First 20 entries in flavor_images:');
      rows.forEach(row => {
        console.log(`id: ${row.id}, flavor_id: ${row.flavor_id}, image_url: ${row.image_url}`);
      });
    }
  } catch (error) {
    console.error('Error checking flavor_images table:', error);
  } finally {
    if (connection) await connection.end();
  }
}

checkFlavorImages(); 