// Use built-in fetch (available in Node.js 18+)

async function testProductsAPI() {
  try {
    console.log('Testing Products API...');
    
    // Test 1: Without admin token (should show only active products)
    console.log('\n1. Testing without admin token:');
    try {
      const response1 = await fetch('http://localhost:3001/api/products?show_deleted=false');
      const data1 = await response1.json();
      console.log('Response:', data1.success ? `Success - ${data1.data.length} products` : 'Failed');
      if (data1.success) {
        console.log('Products:', data1.data.map(p => ({ id: p.id, name: p.name, deleted_at: p.deleted_at })));
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
    
    // Test 2: With show_deleted=true but no admin token (should still show only active)
    console.log('\n2. Testing with show_deleted=true but no admin token:');
    try {
      const response2 = await fetch('http://localhost:3001/api/products?show_deleted=true');
      const data2 = await response2.json();
      console.log('Response:', data2.success ? `Success - ${data2.data.length} products` : 'Failed');
      if (data2.success) {
        console.log('Products:', data2.data.map(p => ({ id: p.id, name: p.name, deleted_at: p.deleted_at })));
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
    
    // Test 3: Test the ViewService directly
    console.log('\n3. Testing ViewService directly:');
    try {
      const { ViewService } = require('./lib/services/viewService');
      
      console.log('Testing active products:');
      const activeProducts = await ViewService.getProducts(false);
      console.log(`Active products: ${activeProducts.length}`);
      console.log('Products:', activeProducts.map(p => ({ id: p.id, name: p.name, deleted_at: p.deleted_at })));
      
      console.log('\nTesting all products:');
      const allProducts = await ViewService.getProducts(true);
      console.log(`All products: ${allProducts.length}`);
      console.log('Products:', allProducts.map(p => ({ id: p.id, name: p.name, deleted_at: p.deleted_at, status: p.status })));
      
    } catch (error) {
      console.log('Error testing ViewService:', error.message);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testProductsAPI(); 