const mysql = require('mysql2/promise');

async function checkDatabaseStructure() {
  let connection;
  try {
    // Create connection using the same credentials as the application
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Goodmorning@1',
      database: process.env.DB_NAME || 'crumbled_nextDB'
    });

    console.log('Checking database structure...\n');

    // Check if cities table exists
    const [citiesTables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('cities', 'city')
    `);

    console.log('Found tables:', citiesTables.map(t => t.TABLE_NAME));

    // Check cities table structure
    if (citiesTables.some(t => t.TABLE_NAME === 'cities')) {
      console.log('\n=== cities table structure ===');
      const [citiesColumns] = await connection.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'cities'
        ORDER BY ORDINAL_POSITION
      `);
      citiesColumns.forEach(col => {
        console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
      });

      // Check cities data
      const [citiesData] = await connection.query('SELECT id, name, is_active FROM cities LIMIT 5');
      console.log('\nSample cities data:');
      citiesData.forEach(city => {
        console.log(`ID: ${city.id}, Name: ${city.name}, Active: ${city.is_active}`);
      });
    }

    // Check city table structure (old)
    if (citiesTables.some(t => t.TABLE_NAME === 'city')) {
      console.log('\n=== city table structure (old) ===');
      const [cityColumns] = await connection.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'city'
        ORDER BY ORDINAL_POSITION
      `);
      cityColumns.forEach(col => {
        console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
      });

      // Check city data
      const [cityData] = await connection.query('SELECT id, name, status FROM city LIMIT 5');
      console.log('\nSample city data:');
      cityData.forEach(city => {
        console.log(`ID: ${city.id}, Name: ${city.name}, Status: ${city.status}`);
      });
    }

    // Check zones table structure
    const [zonesTables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'zones'
    `);

    console.log('\nFound zone tables:', zonesTables.map(t => t.TABLE_NAME));

    // Check zones table structure
    if (zonesTables.some(t => t.TABLE_NAME === 'zones')) {
      console.log('\n=== zones table structure ===');
      const [zonesColumns] = await connection.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'zones'
        ORDER BY ORDINAL_POSITION
      `);
      zonesColumns.forEach(col => {
        console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
      });

      // Check zones data
      const [zonesData] = await connection.query('SELECT id, name, city_id, delivery_fee, is_active FROM zones LIMIT 5');
      console.log('\nSample zones data:');
      zonesData.forEach(zone => {
        console.log(`ID: ${zone.id}, Name: ${zone.name}, City ID: ${zone.city_id}, Delivery Fee: ${zone.delivery_fee}, Active: ${zone.is_active}`);
      });
    }

    // Check if old zone table still exists (should be dropped)
    const [oldZoneTables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'zone'
    `);

    if (oldZoneTables.length > 0) {
      console.log('\n⚠️  WARNING: Old zone table still exists and should be dropped!');
      console.log('Run the migration: safe_drop_old_zone_table.sql');
    } else {
      console.log('\n✅ Old zone table has been successfully dropped');
    }

  } catch (error) {
    console.error('Error checking database structure:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabaseStructure(); 