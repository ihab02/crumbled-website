const mysql = require('mysql2/promise');

async function checkOrders() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });

    console.log('Connected to database');

    // Check recent orders
    const [orders] = await connection.query(`
      SELECT o.id, o.customer_id, c.type as customer_type, c.email 
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      ORDER BY o.id DESC LIMIT 5
    `);
    
    console.log('Recent orders:');
    orders.forEach(order => {
      console.log(`  Order ${order.id}: customer_id=${order.customer_id}, type=${order.customer_type}, email=${order.email}`);
    });

    // Test the API directly with a simple query
    console.log('\nTesting direct query for order 42:');
    const [order42] = await connection.query(`
      SELECT oi.*, oi.flavor_details
      FROM order_items oi
      WHERE oi.order_id = 42
    `);
    
    console.log('Order items for order 42:');
    order42.forEach(item => {
      console.log(`  Item ${item.id}:`);
      console.log(`    Product: ${item.product_name}`);
      console.log(`    Type: ${item.product_type}`);
      console.log(`    Pack Size: ${item.pack_size}`);
      console.log(`    Flavor Details:`, item.flavor_details);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkOrders(); 