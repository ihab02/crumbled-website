const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixReviewStatistics() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔧 Fixing review statistics for existing flavors and products...');

    // Fix flavors review statistics
    console.log('📊 Updating flavors review statistics...');
    await connection.query(`
      UPDATE flavors 
      SET 
        total_reviews = (
          SELECT COUNT(*) 
          FROM customer_reviews 
          WHERE flavor_id = flavors.id AND is_approved = true
        ),
        average_rating = COALESCE((
          SELECT AVG(rating) 
          FROM customer_reviews 
          WHERE flavor_id = flavors.id AND is_approved = true
        ), 0.00),
        review_count_1_star = (
          SELECT COUNT(*) 
          FROM customer_reviews 
          WHERE flavor_id = flavors.id AND rating = 1 AND is_approved = true
        ),
        review_count_2_star = (
          SELECT COUNT(*) 
          FROM customer_reviews 
          WHERE flavor_id = flavors.id AND rating = 2 AND is_approved = true
        ),
        review_count_3_star = (
          SELECT COUNT(*) 
          FROM customer_reviews 
          WHERE flavor_id = flavors.id AND rating = 3 AND is_approved = true
        ),
        review_count_4_star = (
          SELECT COUNT(*) 
          FROM customer_reviews 
          WHERE flavor_id = flavors.id AND rating = 4 AND is_approved = true
        ),
        review_count_5_star = (
          SELECT COUNT(*) 
          FROM customer_reviews 
          WHERE flavor_id = flavors.id AND rating = 5 AND is_approved = true
        )
    `);

    // Fix products review statistics
    console.log('📊 Updating products review statistics...');
    await connection.query(`
      UPDATE products 
      SET 
        total_reviews = (
          SELECT COUNT(*) 
          FROM customer_reviews 
          WHERE product_id = products.id AND is_approved = true
        ),
        average_rating = COALESCE((
          SELECT AVG(rating) 
          FROM customer_reviews 
          WHERE product_id = products.id AND is_approved = true
        ), 0.00),
        review_count_1_star = (
          SELECT COUNT(*) 
          FROM customer_reviews 
          WHERE product_id = products.id AND rating = 1 AND is_approved = true
        ),
        review_count_2_star = (
          SELECT COUNT(*) 
          FROM customer_reviews 
          WHERE product_id = products.id AND rating = 2 AND is_approved = true
        ),
        review_count_3_star = (
          SELECT COUNT(*) 
          FROM customer_reviews 
          WHERE product_id = products.id AND rating = 3 AND is_approved = true
        ),
        review_count_4_star = (
          SELECT COUNT(*) 
          FROM customer_reviews 
          WHERE product_id = products.id AND rating = 4 AND is_approved = true
        ),
        review_count_5_star = (
          SELECT COUNT(*) 
          FROM customer_reviews 
          WHERE product_id = products.id AND rating = 5 AND is_approved = true
        )
    `);

    // Fix customers review statistics
    console.log('📊 Updating customers review statistics...');
    await connection.query(`
      UPDATE customers 
      SET 
        total_reviews = (
          SELECT COUNT(*) 
          FROM customer_reviews 
          WHERE customer_id = customers.id AND is_approved = true
        ),
        average_rating = COALESCE((
          SELECT AVG(rating) 
          FROM customer_reviews 
          WHERE customer_id = customers.id AND is_approved = true
        ), 0.00),
        last_review_date = (
          SELECT MAX(created_at) 
          FROM customer_reviews 
          WHERE customer_id = customers.id AND is_approved = true
        )
    `);

    console.log('✅ Review statistics fixed successfully!');
    
    // Show summary
    const [flavorsResult] = await connection.query('SELECT COUNT(*) as count FROM flavors');
    const [productsResult] = await connection.query('SELECT COUNT(*) as count FROM products');
    const [customersResult] = await connection.query('SELECT COUNT(*) as count FROM customers');
    const [reviewsResult] = await connection.query('SELECT COUNT(*) as count FROM customer_reviews WHERE is_approved = true');
    
    console.log('📈 Summary:');
    console.log(`  - Flavors: ${flavorsResult.count}`);
    console.log(`  - Products: ${productsResult.count}`);
    console.log(`  - Customers: ${customersResult.count}`);
    console.log(`  - Approved Reviews: ${reviewsResult.count}`);

  } catch (error) {
    console.error('❌ Error fixing review statistics:', error);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

fixReviewStatistics(); 