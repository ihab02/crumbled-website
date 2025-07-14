// Test script for order details API with flavors
async function testOrderAPI() {
  try {
    console.log('Testing Order Details API with flavors...');
    
    // Test order 42
    const response = await fetch('http://localhost:3001/api/orders/42');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Order details retrieved successfully');
      console.log('Order ID:', data.order.id);
      console.log('Customer:', data.order.customer_name);
      console.log('Total:', data.order.total_amount);
      console.log('Items count:', data.order.items.length);
      
      data.order.items.forEach((item, index) => {
        console.log(`\nItem ${index + 1}:`);
        console.log(`  Product: ${item.product_name}`);
        console.log(`  Type: ${item.product_type}`);
        console.log(`  Pack Size: ${item.pack_size || 'N/A'}`);
        console.log(`  Quantity: ${item.quantity}`);
        console.log(`  Unit Price: ${item.unit_price}`);
        console.log(`  Flavors count: ${item.flavors.length}`);
        
        if (item.flavors.length > 0) {
          console.log('  Flavors:');
          item.flavors.forEach(flavor => {
            console.log(`    • ${flavor.flavor_name} (${flavor.quantity}x) - ${flavor.size_name}`);
          });
        } else {
          console.log('  No flavors found');
        }
      });
    } else {
      console.log('❌ Failed to retrieve order details:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testOrderAPI(); 