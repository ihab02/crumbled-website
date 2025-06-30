const { databaseService } = require('../lib/services/databaseService');

async function clearAllOrders() {
  try {
    console.log('🔄 Starting to clear all orders...');
    
    // Start transaction
    const result = await databaseService.transaction(async (connection) => {
      console.log('🗑️  Deleting product_instance_flavor records...');
      await connection.query('DELETE FROM product_instance_flavor');
      
      console.log('🗑️  Deleting order_items records...');
      await connection.query('DELETE FROM order_items');
      
      console.log('🗑️  Deleting product_instance records...');
      await connection.query('DELETE FROM product_instance');
      
      console.log('🗑️  Deleting orders...');
      await connection.query('DELETE FROM orders');
      
      console.log('🔄 Resetting auto-increment counters...');
      await connection.query('ALTER TABLE orders AUTO_INCREMENT = 1');
      await connection.query('ALTER TABLE order_items AUTO_INCREMENT = 1');
      await connection.query('ALTER TABLE product_instance AUTO_INCREMENT = 1');
      await connection.query('ALTER TABLE product_instance_flavor AUTO_INCREMENT = 1');
      
      return 'success';
    });
    
    console.log('✅ All orders cleared successfully!');
    
    // Verify the cleanup
    const [ordersCount] = await databaseService.query('SELECT COUNT(*) as count FROM orders');
    const [orderItemsCount] = await databaseService.query('SELECT COUNT(*) as count FROM order_items');
    const [productInstanceCount] = await databaseService.query('SELECT COUNT(*) as count FROM product_instance');
    const [productInstanceFlavorCount] = await databaseService.query('SELECT COUNT(*) as count FROM product_instance_flavor');
    
    console.log('📊 Verification:');
    console.log(`   Orders: ${ordersCount[0].count}`);
    console.log(`   Order Items: ${orderItemsCount[0].count}`);
    console.log(`   Product Instances: ${productInstanceCount[0].count}`);
    console.log(`   Product Instance Flavors: ${productInstanceFlavorCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Error clearing orders:', error);
  } finally {
    process.exit(0);
  }
}

clearAllOrders(); 