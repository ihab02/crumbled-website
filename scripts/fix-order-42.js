const mysql = require('mysql2/promise');

async function fixOrder42() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });

    console.log('Connected to database');

    // First, let's see what product_instances are available
    const [productInstances] = await connection.query('SELECT * FROM product_instance LIMIT 5');
    console.log('Available product instances:');
    productInstances.forEach(pi => {
      console.log(`  ID: ${pi.id}, Type: ${pi.product_type}, Product: ${pi.product_id}, Size: ${pi.size_id}`);
    });

    // Get product details
    const [products] = await connection.query('SELECT * FROM products LIMIT 3');
    console.log('\nAvailable products:');
    products.forEach(p => {
      console.log(`  ID: ${p.id}, Name: ${p.name}`);
    });

    // Add sample order items to order 42
    console.log('\nAdding sample order items to order 42...');
    
    // Add a pack order item
    await connection.execute(`
      INSERT INTO order_items (
        order_id, product_instance_id, quantity, unit_price,
        product_name, product_type, pack_size, flavor_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      42, // order_id
      1,  // product_instance_id
      2,  // quantity
      175.00, // unit_price
      'Cookie Pack', // product_name
      'pack', // product_type
      'mini', // pack_size
      JSON.stringify([
        { flavor_name: 'Chocolate Chip', size_name: 'mini', quantity: 1 },
        { flavor_name: 'Vanilla', size_name: 'mini', quantity: 1 }
      ]) // flavor_details
    ]);

    console.log('✅ Added pack order item');

    // Add an individual order item
    await connection.execute(`
      INSERT INTO order_items (
        order_id, product_instance_id, quantity, unit_price,
        product_name, product_type
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      42, // order_id
      2,  // product_instance_id
      1,  // quantity
      200.00, // unit_price
      'Individual Cookie', // product_name
      'individual' // product_type
    ]);

    console.log('✅ Added individual order item');

    // Verify the items were added
    const [newOrderItems] = await connection.query('SELECT * FROM order_items WHERE order_id = 42');
    console.log(`\nOrder 42 now has ${newOrderItems.length} items:`);
    newOrderItems.forEach(item => {
      console.log(`  - ${item.product_name} (${item.product_type}) x${item.quantity} - ${item.unit_price} EGP`);
      if (item.flavor_details) {
        const flavors = JSON.parse(item.flavor_details);
        flavors.forEach(flavor => {
          console.log(`    • ${flavor.flavor_name} (${flavor.size_name}) x${flavor.quantity}`);
        });
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixOrder42(); 