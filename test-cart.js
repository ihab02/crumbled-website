const fetch = require('node-fetch');

async function testCart() {
  try {
    console.log('🧪 Testing cart system...');
    
    // Test adding an item to cart
    const addItemResponse = await fetch('http://localhost:3001/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: 1,
        quantity: 1,
        flavors: [
          { id: 1, quantity: 1, size: 'Medium' },
          { id: 2, quantity: 1, size: 'Medium' },
          { id: 3, quantity: 1, size: 'Medium' }
        ]
      })
    });
    
    const addResult = await addItemResponse.json();
    console.log('📦 Add to cart result:', addResult);
    
    // Test getting cart
    const getCartResponse = await fetch('http://localhost:3001/api/cart', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const cartData = await getCartResponse.json();
    console.log('🛒 Cart data:', cartData);
    
  } catch (error) {
    console.error('❌ Error testing cart:', error);
  }
}

testCart(); 