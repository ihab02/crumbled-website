const mysql = require('mysql2/promise');

async function test() {
  try {
    console.log('Testing database connection...');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });

    console.log('✅ Connected to database');

    const [orders] = await connection.query('SELECT COUNT(*) as count FROM orders');
    console.log('Total orders:', orders[0].count);

    const [orderItems] = await connection.query('SELECT COUNT(*) as count FROM order_items');
    console.log('Total order items:', orderItems[0].count);

    await connection.end();
    console.log('✅ Test completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test(); 