// Test script for enhanced order details API
// This script tests the new order details structure with product names, pack sizes, and flavor details

async function testOrderDetailsAPI() {
  try {
    console.log('Testing Enhanced Order Details API...');
    
    // Test 1: Get order details for a specific order
    console.log('\n1. Testing order details API:');
    try {
      const response = await fetch('http://localhost:3001/api/orders/41');
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Order details retrieved successfully');
        console.log('Order ID:', data.order.id);
        console.log('Customer:', data.order.customer_name);
        console.log('Total:', data.order.total);
        console.log('Items count:', data.order.items.length);
        
        // Check the new structure
        data.order.items.forEach((item, index) => {
          console.log(`\nItem ${index + 1}:`);
          console.log('  Product Name:', item.product_name);
          console.log('  Product Type:', item.product_type);
          console.log('  Pack Size:', item.pack_size || 'N/A');
          console.log('  Quantity:', item.quantity);
          console.log('  Unit Price:', item.unit_price);
          
          if (item.flavors && item.flavors.length > 0) {
            console.log('  Flavors:');
            item.flavors.forEach((flavor, flavorIndex) => {
              console.log(`    ${flavorIndex + 1}. ${flavor.flavor_name} (${flavor.quantity}x) - ${flavor.size_name}`);
            });
          } else {
            console.log('  Flavors: None (single product)');
          }
        });
        
        // Verify the structure matches our expectations
        const hasNewStructure = data.order.items.every(item => 
          item.product_name && 
          item.product_type && 
          typeof item.quantity === 'number' &&
          typeof item.unit_price === 'number' &&
          (!item.flavors || item.flavors.every(flavor => 
            flavor.flavor_name && 
            flavor.size_name && 
            typeof flavor.quantity === 'number'
          ))
        );
        
        if (hasNewStructure) {
          console.log('\n✅ All items have the correct enhanced structure');
        } else {
          console.log('\n❌ Some items are missing the enhanced structure');
        }
        
      } else {
        console.log('❌ Failed to retrieve order details:', data.error);
      }
    } catch (error) {
      console.log('❌ Error testing order details API:', error.message);
    }
    
    // Test 2: Test admin order details API
    console.log('\n2. Testing admin order details API:');
    try {
      const response = await fetch('http://localhost:3001/api/admin/orders/41');
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Admin order details retrieved successfully');
        console.log('Order ID:', data.order.id);
        console.log('Items count:', data.order.items.length);
        
        // Check admin-specific fields
        if (data.order.delivery_man_name) {
          console.log('Delivery Person:', data.order.delivery_man_name);
        }
        
        // Verify the same enhanced structure
        const hasNewStructure = data.order.items.every(item => 
          item.product_name && 
          item.product_type && 
          typeof item.quantity === 'number' &&
          typeof item.unit_price === 'number' &&
          (!item.flavors || item.flavors.every(flavor => 
            flavor.flavor_name && 
            flavor.size_name && 
            typeof flavor.quantity === 'number'
          ))
        );
        
        if (hasNewStructure) {
          console.log('✅ Admin order details have the correct enhanced structure');
        } else {
          console.log('❌ Admin order details are missing the enhanced structure');
        }
        
      } else {
        console.log('❌ Failed to retrieve admin order details:', data.error);
      }
    } catch (error) {
      console.log('❌ Error testing admin order details API:', error.message);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testOrderDetailsAPI(); 