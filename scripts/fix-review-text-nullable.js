const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixReviewTextNullable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔧 Making review_text field nullable...');
    
    // Make review_text field nullable
    await connection.query(`
      ALTER TABLE customer_reviews 
      MODIFY COLUMN review_text TEXT NULL
    `);
    
    // Update existing empty reviews to have NULL instead of empty string
    await connection.query(`
      UPDATE customer_reviews 
      SET review_text = NULL 
      WHERE review_text = '' OR review_text IS NULL
    `);
    
    console.log('✅ Review text field is now nullable!');
    
    // Show summary
    const [result] = await connection.query('SELECT COUNT(*) as count FROM customer_reviews WHERE review_text IS NULL');
    console.log(`📊 Reviews with NULL text: ${result.count}`);

  } catch (error) {
    console.error('❌ Error fixing review text nullable:', error);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

fixReviewTextNullable(); 