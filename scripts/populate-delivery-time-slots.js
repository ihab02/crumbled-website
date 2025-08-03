const mysql = require('mysql2/promise');

async function populateDeliveryTimeSlots() {
  let connection;
  
  try {
    // Database configuration
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'crumbled_website',
      port: process.env.DB_PORT || 3306
    };

    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database successfully');

    // Update existing orders to have the "Morning Slot" time slot information
    console.log('🔍 Updating existing orders with default time slot...');
    
    const [result] = await connection.execute(`
      UPDATE orders 
      SET 
        delivery_time_slot_name = 'Morning Slot',
        from_hour = '11:00:00',
        to_hour = '17:00:00'
      WHERE delivery_time_slot_name IS NULL
    `);

    console.log(`✅ Updated ${result.affectedRows} orders with default time slot information`);

    // Verify the update
    const [verifyResult] = await connection.execute(`
      SELECT COUNT(*) as total_orders, 
             COUNT(delivery_time_slot_name) as orders_with_time_slot
      FROM orders
    `);

    console.log('📊 Order statistics:');
    console.log(`  - Total orders: ${verifyResult[0].total_orders}`);
    console.log(`  - Orders with time slot: ${verifyResult[0].orders_with_time_slot}`);

  } catch (error) {
    console.error('❌ Error populating delivery time slots:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
populateDeliveryTimeSlots()
  .then(() => {
    console.log('✅ Delivery time slots population completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 