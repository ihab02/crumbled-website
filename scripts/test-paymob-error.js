#!/usr/bin/env node

/**
 * Paymob Error Test Script
 * 
 * This script tests the Paymob payment process to identify the specific error
 */

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

async function testPaymobConfig() {
  console.log('🔧 Testing Paymob Configuration...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test-paymob-config`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Paymob config test passed');
      console.log('📋 Config:', data.data.config);
      return data.data.config;
    } else {
      console.error('❌ Paymob config test failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Paymob config test error:', error.message);
    return null;
  }
}

async function testPaymobAuth() {
  console.log('\n🔐 Testing Paymob Authentication...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/paymob/test-auth`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Paymob auth test passed');
      console.log('📋 Auth token received');
      return true;
    } else {
      console.error('❌ Paymob auth test failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Paymob auth test error:', error.message);
    return false;
  }
}

async function testPaymobOrderCreation() {
  console.log('\n🛒 Testing Paymob Order Creation...');
  
  try {
    const orderData = {
      amount: 100,
      items: [{
        name: 'Test Product',
        amount: 100,
        description: 'Test product for payment',
        quantity: 1
      }],
      delivery_needed: true
    };
    
    const response = await fetch(`${BASE_URL}/api/paymob/test-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Paymob order creation test passed');
      console.log('📋 Order ID:', data.data.orderId);
      return data.data.orderId;
    } else {
      console.error('❌ Paymob order creation test failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Paymob order creation test error:', error.message);
    return null;
  }
}

async function testPaymobPaymentKey(orderId) {
  console.log('\n💳 Testing Paymob Payment Key Generation...');
  
  try {
    const paymentData = {
      orderId: orderId,
      amount: 100,
      billingData: {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone_number: '1234567890',
        street: 'Test Street',
        city: 'Test City',
        country: 'Egypt',
        apartment: 'NA',
        floor: 'NA',
        building: 'NA',
        postal_code: 'NA',
        state: 'NA'
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/paymob/test-payment-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Paymob payment key test passed');
      console.log('📋 Payment token:', data.data.paymentToken);
      console.log('📋 Payment URL:', data.data.paymentUrl);
      return data.data;
    } else {
      console.error('❌ Paymob payment key test failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Paymob payment key test error:', error.message);
    return null;
  }
}

async function runPaymobErrorTest() {
  console.log('🚀 Starting Paymob Error Test...\n');
  
  // Step 1: Test configuration
  const config = await testPaymobConfig();
  if (!config) {
    console.log('\n❌ Paymob configuration is not set up properly');
    console.log('💡 Please add PAYMOB_API_KEY and PAYMOB_INTEGRATION_ID to your .env.local file');
    return false;
  }
  
  // Step 2: Test authentication
  const authSuccess = await testPaymobAuth();
  if (!authSuccess) {
    console.log('\n❌ Paymob authentication failed');
    console.log('💡 Please check your PAYMOB_API_KEY in .env.local');
    return false;
  }
  
  // Step 3: Test order creation
  const orderId = await testPaymobOrderCreation();
  if (!orderId) {
    console.log('\n❌ Paymob order creation failed');
    return false;
  }
  
  // Step 4: Test payment key generation
  const paymentData = await testPaymobPaymentKey(orderId);
  if (!paymentData) {
    console.log('\n❌ Paymob payment key generation failed');
    return false;
  }
  
  console.log('\n🎉 All Paymob tests passed!');
  console.log('✅ The Paymob integration is working correctly');
  console.log('📋 You can use this payment URL for testing:', paymentData.paymentUrl);
  
  return true;
}

// Run test if this script is executed directly
if (require.main === module) {
  runPaymobErrorTest()
    .then(success => {
      if (!success) {
        console.log('\n🔧 Troubleshooting:');
        console.log('- Check that PAYMOB_API_KEY is set in .env.local');
        console.log('- Check that PAYMOB_INTEGRATION_ID is set in .env.local');
        console.log('- Verify your Paymob credentials are correct');
        console.log('- Check server logs for detailed error messages');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testPaymobConfig,
  testPaymobAuth,
  testPaymobOrderCreation,
  testPaymobPaymentKey,
  runPaymobErrorTest
}; 