console.log('🚀 Starting checkout flow test...');

const testCheckoutFlow = async () => {
  try {
    console.log('🧪 Testing checkout flow with sample data...');
    
    // Sample data based on the logs
    const testOrderData = {
      cart: {
        items: [
          {
            id: 1, // pack_id
            name: '3 PCS Pack',
            basePrice: 300,
            quantity: 1,
            isPack: true,
            packSize: 'Large',
            imageUrl: '/uploads/packs/1749953551374-230292826-3 pcs.png',
            count: 3,
            flavorDetails: 'Oreo, Strawberry, Vanilla',
            total: 300,
            flavors: [
              { id: 4, name: 'Oreo', quantity: 1, price: 50, size: 'Large' },
              { id: 3, name: 'Strawberry', quantity: 1, price: 45, size: 'Large' },
              { id: 2, name: 'Vanilla', quantity: 1, price: 45, size: 'Large' }
            ]
          }
        ],
        subtotal: 300,
        deliveryFee: 20,
        total: 320,
        itemCount: 1
      },
      deliveryAddress: {
        street_address: '123 Test Street',
        additional_info: 'Apartment 4B',
        city_name: 'Cairo',
        zone_name: 'Maadi',
        delivery_fee: 20
      },
      customerInfo: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+201234567890'
      }
    };

    const requestBody = {
      paymentMethod: 'cod',
      orderData: testOrderData
    };

    console.log('📤 Sending request to payment API...');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('http://localhost:3001/api/checkout/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'cart_id=20' // Use the cart ID from logs
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', JSON.stringify(responseData, null, 2));

    if (response.ok && responseData.success) {
      console.log('✅ Checkout test successful!');
      console.log('Order ID:', responseData.data?.orderId);
      
      // Test admin orders API to see if order items are created
      console.log('\n🔍 Testing admin orders API...');
      const adminResponse = await fetch('http://localhost:3001/api/admin/orders');
      const adminData = await adminResponse.json();
      
      console.log('Admin orders response:', JSON.stringify(adminData, null, 2));
      
      if (adminData.orders && adminData.orders.length > 0) {
        const latestOrder = adminData.orders[0];
        console.log('Latest order:', JSON.stringify(latestOrder, null, 2));
        
        if (latestOrder.order_items && latestOrder.order_items.length > 0) {
          console.log('✅ Order items created successfully!');
          console.log('Order items count:', latestOrder.order_items.length);
        } else {
          console.log('❌ No order items found in admin response');
        }
      }
      
    } else {
      console.log('❌ Checkout test failed!');
      console.log('Error:', responseData.error || responseData.message);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test
console.log('🔄 Calling testCheckoutFlow function...');
testCheckoutFlow().then(() => {
  console.log('✅ Test completed');
}).catch((error) => {
  console.error('❌ Test failed with error:', error);
}); 