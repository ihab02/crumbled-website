const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Goodmorning@1',
  database: 'crumbled_nextDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function runMigration() {
  try {
    console.log('Creating user_favorites table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_favorites (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        flavor_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_flavor (user_id, flavor_id),
        FOREIGN KEY (user_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (flavor_id) REFERENCES flavors(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_flavor_id (flavor_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `;
    
    await pool.execute(createTableSQL);
    console.log('✅ user_favorites table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating user_favorites table:', error);
  } finally {
    await pool.end();
  }
}

runMigration(); 