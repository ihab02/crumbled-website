const mysql = require('mysql2/promise');

async function debugOrder42() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });

    console.log('Connected to database');

    // Check if order 42 exists
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = 42');
    console.log('Order 42:', orders.length > 0 ? 'EXISTS' : 'NOT FOUND');
    if (orders.length > 0) {
      console.log('Order details:', JSON.stringify(orders[0], null, 2));
    }

    // Check order_items for order 42
    const [orderItems] = await connection.query('SELECT * FROM order_items WHERE order_id = 42');
    console.log(`\nOrder items for order 42: ${orderItems.length} items found`);
    if (orderItems.length > 0) {
      console.log('Order items:', JSON.stringify(orderItems, null, 2));
    }

    // Check if there are any order_items at all
    const [allOrderItems] = await connection.query('SELECT order_id, COUNT(*) as count FROM order_items GROUP BY order_id ORDER BY order_id DESC LIMIT 5');
    console.log('\nOrder items count by order:');
    allOrderItems.forEach(row => {
      console.log(`  Order ${row.order_id}: ${row.count} items`);
    });

    // Check the product_instance table
    const [productInstances] = await connection.query('SELECT * FROM product_instance LIMIT 3');
    console.log('\nSample product_instances:');
    console.log(JSON.stringify(productInstances, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugOrder42(); 