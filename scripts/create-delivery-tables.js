const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDeliveryTables() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'crumbled_nextDB'
    });

    console.log('Connected to database');

    // Create delivery_men table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS delivery_men (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        id_number VARCHAR(50) UNIQUE NOT NULL,
        home_address TEXT NOT NULL,
        mobile_phone VARCHAR(20) NOT NULL,
        available_from_hour TIME NOT NULL,
        available_to_hour TIME NOT NULL,
        available_days JSON NOT NULL,
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Created delivery_men table');

    // Create delivery_time_slots table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS delivery_time_slots (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        from_hour TIME NOT NULL,
        to_hour TIME NOT NULL,
        available_days JSON NOT NULL,
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Created delivery_time_slots table');

    // Create indexes (with error handling for existing indexes)
    try {
      await connection.execute(`
        CREATE INDEX idx_delivery_men_active ON delivery_men(is_active)
      `);
      console.log('Created index: idx_delivery_men_active');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('Index idx_delivery_men_active already exists');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`
        CREATE INDEX idx_delivery_men_id_number ON delivery_men(id_number)
      `);
      console.log('Created index: idx_delivery_men_id_number');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('Index idx_delivery_men_id_number already exists');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`
        CREATE INDEX idx_delivery_time_slots_active ON delivery_time_slots(is_active)
      `);
      console.log('Created index: idx_delivery_time_slots_active');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('Index idx_delivery_time_slots_active already exists');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`
        CREATE INDEX idx_delivery_time_slots_name ON delivery_time_slots(name)
      `);
      console.log('Created index: idx_delivery_time_slots_name');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('Index idx_delivery_time_slots_name already exists');
      } else {
        throw error;
      }
    }

    console.log('✅ All delivery management tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDeliveryTables(); 