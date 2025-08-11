const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanupExpiredCarts() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('🔄 Starting expired cart cleanup...');

    // Get carts that have expired
    const [expiredCarts] = await connection.execute(`
      SELECT id, user_id, session_id, created_at, expires_at 
      FROM carts 
      WHERE status = 'active' 
      AND expires_at IS NOT NULL 
      AND expires_at < NOW()
    `);

    if (expiredCarts.length === 0) {
      console.log('✅ No expired carts found');
      return;
    }

    console.log(`📦 Found ${expiredCarts.length} expired carts`);

    // Mark expired carts as abandoned
    const [updateResult] = await connection.execute(`
      UPDATE carts 
      SET status = 'abandoned' 
      WHERE status = 'active' 
      AND expires_at IS NOT NULL 
      AND expires_at < NOW()
    `);

    console.log(`✅ Marked ${updateResult.affectedRows} carts as abandoned`);

    // Get statistics
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_carts,
        SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) as user_carts,
        SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as guest_carts,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_carts,
        SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) as abandoned_carts
      FROM carts
    `);

    console.log('📊 Cart Statistics:');
    console.log(`   Total carts: ${stats[0].total_carts}`);
    console.log(`   User carts: ${stats[0].user_carts}`);
    console.log(`   Guest carts: ${stats[0].guest_carts}`);
    console.log(`   Active carts: ${stats[0].active_carts}`);
    console.log(`   Abandoned carts: ${stats[0].abandoned_carts}`);

  } catch (error) {
    console.error('❌ Error during cart cleanup:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupExpiredCarts()
    .then(() => {
      console.log('✅ Cart cleanup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cart cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = cleanupExpiredCarts;
