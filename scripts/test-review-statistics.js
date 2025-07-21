const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Goodmorning@1',
  database: process.env.DB_NAME || 'crumbled_nextDB',
  port: process.env.DB_PORT || 3306
};

async function testReviewStatistics() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Get a flavor to test with
    const [flavors] = await connection.execute(`
      SELECT id, name, total_reviews, average_rating 
      FROM flavors 
      WHERE is_enabled = 1 
      LIMIT 1
    `);
    
    if (flavors.length === 0) {
      console.log('No flavors found to test with');
      return;
    }
    
    const flavor = flavors[0];
    console.log(`\nTesting with flavor: ${flavor.name} (ID: ${flavor.id})`);
    console.log(`Current statistics: ${flavor.total_reviews} reviews, ${flavor.average_rating} average rating`);
    
    // Get current reviews for this flavor
    const [reviews] = await connection.execute(`
      SELECT COUNT(*) as count, AVG(rating) as avg_rating
      FROM customer_reviews 
      WHERE flavor_id = ? AND is_approved = true
    `, [flavor.id]);
    
    console.log(`Actual reviews in database: ${reviews[0].count} reviews, ${reviews[0].avg_rating} average rating`);
    
    // Check if statistics match
    if (flavor.total_reviews === reviews[0].count && 
        Math.abs(flavor.average_rating - reviews[0].avg_rating) < 0.01) {
      console.log('✅ Statistics are up to date!');
    } else {
      console.log('❌ Statistics are out of sync!');
      console.log('This means the updateFlavorStatistics function needs to be called.');
    }
    
    // Show detailed review breakdown
    const [starCounts] = await connection.execute(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM customer_reviews 
      WHERE flavor_id = ? AND is_approved = true
      GROUP BY rating
      ORDER BY rating
    `, [flavor.id]);
    
    console.log('\nReview breakdown by stars:');
    starCounts.forEach(row => {
      console.log(`  ${row.rating} stars: ${row.count} reviews`);
    });
    
  } catch (error) {
    console.error('Error testing review statistics:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testReviewStatistics().then(() => {
  console.log('\nTest completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 