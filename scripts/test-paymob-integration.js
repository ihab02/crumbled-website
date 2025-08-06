#!/usr/bin/env node

/**
 * Paymob Integration Test Script
 * 
 * This script tests the complete Paymob integration flow:
 * 1. Configuration validation
 * 2. Authentication test
 * 3. Order creation test
 * 4. Payment key generation test
 * 5. Payment URL generation test
 * 6. Webhook handling test
 */

// Use built-in fetch (available in Node.js 18+)
// If using older Node.js version, you'll need to install node-fetch

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const TEST_ORDER_DATA = {
  amount: 100.50,
  items: [
    {
      name: 'Test Product',
      amount: 100.50,
      description: 'Test product for Paymob integration',
      quantity: 1
    }
  ],
  delivery_needed: true
};

const TEST_BILLING_DATA = {
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  phone_number: '+201234567890',
  street: '123 Test Street',
  city: 'Cairo',
  country: 'Egypt',
  apartment: 'Apt 1',
  building: 'Building A',
  floor: '1st Floor',
  postal_code: '12345',
  state: 'Cairo'
};

async function testPaymobConfig() {
  console.log('🔧 Testing Paymob Configuration...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test-paymob-config`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Configuration check passed');
      console.log('📋 Config:', data.data.config);
      console.log('🔐 Auth test:', data.data.authTest);
      console.log('✅ All required fields:', data.data.hasAllRequired);
      
      if (!data.data.hasAllRequired) {
        console.error('❌ Missing required environment variables');
        return false;
      }
      
      if (!data.data.authTest.success) {
        console.error('❌ Paymob authentication failed:', data.data.authTest.error);
        return false;
      }
      
      return true;
    } else {
      console.error('❌ Configuration check failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Configuration test error:', error.message);
    return false;
  }
}

async function testPaymobOrderCreation() {
  console.log('\n🛒 Testing Paymob Order Creation...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/paymob/test-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_ORDER_DATA)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Order creation test passed');
      console.log('📋 Order ID:', data.data.orderId);
      console.log('💰 Amount:', data.data.amount);
      return data.data.orderId;
    } else {
      console.error('❌ Order creation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Order creation test error:', error.message);
    return null;
  }
}

async function testPaymentKeyGeneration(orderId) {
  console.log('\n🔑 Testing Payment Key Generation...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/paymob/test-payment-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount: TEST_ORDER_DATA.amount,
        billingData: TEST_BILLING_DATA
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Payment key generation test passed');
      console.log('🔑 Payment token:', data.data.paymentToken);
      console.log('🌐 Payment URL:', data.data.paymentUrl);
      return data.data.paymentToken;
    } else {
      console.error('❌ Payment key generation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Payment key generation test error:', error.message);
    return null;
  }
}

async function testPaymentVerification() {
  console.log('\n🔍 Testing Payment Verification...');
  
  try {
    const testData = {
      orderId: '123',
      transactionId: 'test_transaction_123',
      success: true,
      pending: false
    };
    
    const response = await fetch(`${BASE_URL}/api/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Payment verification test passed');
      console.log('📋 Response:', data.data);
      return true;
    } else {
      console.error('❌ Payment verification failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Payment verification test error:', error.message);
    return false;
  }
}

async function testWebhookHandling() {
  console.log('\n🔔 Testing Webhook Handling...');
  
  try {
    const testWebhookData = {
      type: 'TRANSACTION',
      obj: {
        id: 'test_transaction_123',
        order: { id: 'test_paymob_order_123' },
        success: true,
        amount_cents: 10050,
        currency: 'EGP',
        payment_method: 'card',
        pending: false,
        is_refunded: false,
        is_void: false,
        is_voided: false,
        is_captured: true,
        is_standalone_payment: false,
        error_occured: false,
        is_canceled: false,
        is_returned: false,
        is_deleted: false,
        is_auto_reversed: false,
        is_reversed: false,
        merchant_order_id: '123',
        wallet_notification: null,
        processed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        data: { order_id: '123' }
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/payment/paymob-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testWebhookData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Webhook handling test passed');
      return true;
    } else {
      console.error('❌ Webhook handling failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Webhook handling test error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Paymob Integration Tests...\n');
  
  const results = {
    config: false,
    orderCreation: false,
    paymentKey: false,
    verification: false,
    webhook: false
  };
  
  // Test 1: Configuration
  results.config = await testPaymobConfig();
  if (!results.config) {
    console.error('\n❌ Configuration test failed. Please check your environment variables.');
    return;
  }
  
  // Test 2: Order Creation
  const orderId = await testPaymobOrderCreation();
  results.orderCreation = orderId !== null;
  
  // Test 3: Payment Key Generation
  if (orderId) {
    const paymentToken = await testPaymentKeyGeneration(orderId);
    results.paymentKey = paymentToken !== null;
  }
  
  // Test 4: Payment Verification
  results.verification = await testPaymentVerification();
  
  // Test 5: Webhook Handling
  results.webhook = await testWebhookHandling();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Configuration: ${results.config ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Order Creation: ${results.orderCreation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Payment Key: ${results.paymentKey ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Verification: ${results.verification ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Webhook: ${results.webhook ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Paymob integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  return allPassed;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testPaymobConfig,
  testPaymobOrderCreation,
  testPaymentKeyGeneration,
  testPaymentVerification,
  testWebhookHandling,
  runAllTests
}; 