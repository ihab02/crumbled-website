#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * This script tests the database connection and basic functionality
 */

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test-db`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Database connection test passed');
      console.log('📋 Database info:', data.data);
      return true;
    } else {
      console.error('❌ Database connection test failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Database connection test error:', error.message);
    return false;
  }
}

async function testPaymentAPI() {
  console.log('\n💳 Testing Payment API...');
  
  try {
    // Test with minimal data to see if the endpoint is accessible
    const testData = {
      paymentMethod: 'cod',
      orderData: {
        cart: {
          items: [],
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
          itemCount: 0
        },
        deliveryAddress: {
          street_address: 'Test Address',
          city_name: 'Test City',
          zone_name: 'Test Zone',
          delivery_fee: 0
        },
        customerInfo: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '1234567890'
        }
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/checkout/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Payment API test passed');
      console.log('📋 Response:', data);
      return true;
    } else {
      console.error('❌ Payment API test failed:', response.status);
      console.error('📋 Error response:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Payment API test error:', error.message);
    return false;
  }
}

async function testPaymobConfig() {
  console.log('\n🔧 Testing Paymob Configuration...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test-paymob-config`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Paymob config test passed');
      console.log('📋 Config:', data.data.config);
      return true;
    } else {
      console.error('❌ Paymob config test failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Paymob config test error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Database and API Tests...\n');
  
  const results = {
    database: false,
    paymentAPI: false,
    paymobConfig: false
  };
  
  // Test 1: Database Connection
  results.database = await testDatabaseConnection();
  
  // Test 2: Payment API
  results.paymentAPI = await testPaymentAPI();
  
  // Test 3: Paymob Configuration
  results.paymobConfig = await testPaymobConfig();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Database Connection: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Payment API: ${results.paymentAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Paymob Config: ${results.paymobConfig ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed.');
    console.log('\n🔧 Troubleshooting:');
    if (!results.database) {
      console.log('- Check database connection settings in .env.local');
      console.log('- Verify MySQL server is running');
      console.log('- Check database credentials');
    }
    if (!results.paymentAPI) {
      console.log('- Check server logs for specific error details');
      console.log('- Verify all required environment variables are set');
      console.log('- Check database table structure');
    }
    if (!results.paymobConfig) {
      console.log('- Add PAYMOB_API_KEY to .env.local');
      console.log('- Add PAYMOB_INTEGRATION_ID to .env.local');
    }
  }
  
  return allPassed;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testDatabaseConnection,
  testPaymentAPI,
  testPaymobConfig,
  runTests
}; 