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

    // Check orders
    const [orders] = await connection.query(`
      SELECT o.id, o.total, o.created_at, o.customer_phone, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.id DESC LIMIT 10
    `);
    console.log(`Found ${orders.length} orders:`);
    orders.forEach(order => {
      console.log(`  Order ${order.id}: ${order.customer_name || order.customer_phone || 'No name'} - ${order.total} EGP - ${order.created_at}`);
    });

    // Check order_items
    const [orderItems] = await connection.query('SELECT id, order_id, product_name, product_type, pack_size FROM order_items LIMIT 5');
    console.log(`\nSample order_items:`);
    orderItems.forEach(item => {
      console.log(`  Item ${item.id}: Order ${item.order_id} - ${item.product_name || 'No name'} (${item.product_type || 'No type'}) - Size: ${item.pack_size || 'N/A'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkOrders(); 