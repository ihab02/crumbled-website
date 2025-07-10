// Test script for soft delete functionality in flavors and product-types APIs

async function testSoftDeleteAPIs() {
  try {
    console.log('Testing Soft Delete APIs...');
    
    // Test 1: Flavors API without admin token (should show only active flavors)
    console.log('\n1. Testing Flavors API without admin token:');
    try {
      const response1 = await fetch('http://localhost:3001/api/admin/flavors?show_deleted=false');
      console.log('Response status:', response1.status);
      if (response1.ok) {
        const data1 = await response1.json();
        console.log('Response:', Array.isArray(data1) ? `Success - ${data1.length} flavors` : 'Invalid response format');
        if (Array.isArray(data1)) {
          console.log('Flavors:', data1.map(f => ({ id: f.id, name: f.name, deleted_at: f.deleted_at, status: f.status })));
        }
      } else {
        console.log('Error response:', await response1.text());
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
    
    // Test 2: Flavors API with show_deleted=true but no admin token (should still show only active)
    console.log('\n2. Testing Flavors API with show_deleted=true but no admin token:');
    try {
      const response2 = await fetch('http://localhost:3001/api/admin/flavors?show_deleted=true');
      console.log('Response status:', response2.status);
      if (response2.ok) {
        const data2 = await response2.json();
        console.log('Response:', Array.isArray(data2) ? `Success - ${data2.length} flavors` : 'Invalid response format');
        if (Array.isArray(data2)) {
          console.log('Flavors:', data2.map(f => ({ id: f.id, name: f.name, deleted_at: f.deleted_at, status: f.status })));
        }
      } else {
        console.log('Error response:', await response2.text());
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
    
    // Test 3: Product Types API without admin token (should show only active product types)
    console.log('\n3. Testing Product Types API without admin token:');
    try {
      const response3 = await fetch('http://localhost:3001/api/product-types?show_deleted=false');
      console.log('Response status:', response3.status);
      if (response3.ok) {
        const data3 = await response3.json();
        console.log('Response:', data3.success ? `Success - ${data3.productTypes.length} product types` : 'Failed');
        if (data3.success && Array.isArray(data3.productTypes)) {
          console.log('Product Types:', data3.productTypes.map(pt => ({ id: pt.id, name: pt.name, deleted_at: pt.deleted_at, status: pt.status })));
        }
      } else {
        console.log('Error response:', await response3.text());
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
    
    // Test 4: Product Types API with show_deleted=true but no admin token (should still show only active)
    console.log('\n4. Testing Product Types API with show_deleted=true but no admin token:');
    try {
      const response4 = await fetch('http://localhost:3001/api/product-types?show_deleted=true');
      console.log('Response status:', response4.status);
      if (response4.ok) {
        const data4 = await response4.json();
        console.log('Response:', data4.success ? `Success - ${data4.productTypes.length} product types` : 'Failed');
        if (data4.success && Array.isArray(data4.productTypes)) {
          console.log('Product Types:', data4.productTypes.map(pt => ({ id: pt.id, name: pt.name, deleted_at: pt.deleted_at, status: pt.status })));
        }
      } else {
        console.log('Error response:', await response4.text());
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testSoftDeleteAPIs(); 