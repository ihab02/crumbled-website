#!/usr/bin/env node

/**
 * Simple Paymob Integration Test Script
 * 
 * This script tests the Paymob integration using built-in fetch API
 * No external dependencies required
 */

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

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

async function runSimpleTests() {
  console.log('🚀 Starting Simple Paymob Integration Tests...\n');
  
  const results = {
    config: false,
    verification: false,
    webhook: false
  };
  
  // Test 1: Configuration
  results.config = await testPaymobConfig();
  if (!results.config) {
    console.error('\n❌ Configuration test failed. Please check your environment variables.');
    console.log('\n📝 To fix this:');
    console.log('1. Add PAYMOB_API_KEY to your .env.local file');
    console.log('2. Add PAYMOB_INTEGRATION_ID to your .env.local file');
    console.log('3. Make sure your Paymob account is active');
    return false;
  }
  
  // Test 2: Payment Verification
  results.verification = await testPaymentVerification();
  
  // Test 3: Webhook Handling
  results.webhook = await testWebhookHandling();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Configuration: ${results.config ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Verification: ${results.verification ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Webhook: ${results.webhook ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Paymob integration is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('1. Test the complete payment flow in your application');
    console.log('2. Configure webhooks in your Paymob dashboard');
    console.log('3. Test with real payment methods');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  return allPassed;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runSimpleTests()
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
  testPaymentVerification,
  testWebhookHandling,
  runSimpleTests
}; 