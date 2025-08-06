#!/usr/bin/env node

/**
 * Paymob Callback URLs Test Script
 * 
 * This script tests both callback URLs:
 * 1. Response Callback URL (User redirect)
 * 2. Processed Callback URL (Server webhook)
 */

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

async function testResponseCallback() {
  console.log('🔄 Testing Response Callback URL...');
  
  try {
    // Test successful payment callback
    const successUrl = `${BASE_URL}/payment/callback?success=true&order_id=123&transaction_id=test_transaction_123&amount=100.50`;
    
    console.log('📋 Testing success callback:', successUrl);
    const successResponse = await fetch(successUrl);
    
    if (successResponse.ok) {
      console.log('✅ Response callback (success) - OK');
    } else {
      console.log('❌ Response callback (success) - Failed:', successResponse.status);
    }
    
    // Test failed payment callback
    const failedUrl = `${BASE_URL}/payment/callback?success=false&order_id=123&error_code=PAYMENT_FAILED&error_message=Insufficient%20funds`;
    
    console.log('📋 Testing failed callback:', failedUrl);
    const failedResponse = await fetch(failedUrl);
    
    if (failedResponse.ok) {
      console.log('✅ Response callback (failed) - OK');
    } else {
      console.log('❌ Response callback (failed) - Failed:', failedResponse.status);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Response callback test error:', error.message);
    return false;
  }
}

async function testProcessedCallback() {
  console.log('\n🔔 Testing Processed Callback URL (Webhook)...');
  
  try {
    // Test successful payment webhook
    const successWebhook = {
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
    
    console.log('📋 Testing success webhook');
    const successResponse = await fetch(`${BASE_URL}/api/payment/paymob-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(successWebhook)
    });
    
    if (successResponse.ok) {
      console.log('✅ Processed callback (success) - OK');
    } else {
      console.log('❌ Processed callback (success) - Failed:', successResponse.status);
    }
    
    // Test failed payment webhook
    const failedWebhook = {
      type: 'TRANSACTION',
      obj: {
        id: 'test_transaction_456',
        order: { id: 'test_paymob_order_456' },
        success: false,
        amount_cents: 10050,
        currency: 'EGP',
        payment_method: 'card',
        pending: false,
        is_refunded: false,
        is_void: false,
        is_voided: false,
        is_captured: false,
        is_standalone_payment: false,
        error_occured: true,
        is_canceled: true,
        is_returned: false,
        is_deleted: false,
        is_auto_reversed: false,
        is_reversed: false,
        merchant_order_id: '456',
        wallet_notification: null,
        processed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        data: { order_id: '456' }
      }
    };
    
    console.log('📋 Testing failed webhook');
    const failedResponse = await fetch(`${BASE_URL}/api/payment/paymob-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(failedWebhook)
    });
    
    if (failedResponse.ok) {
      console.log('✅ Processed callback (failed) - OK');
    } else {
      console.log('❌ Processed callback (failed) - Failed:', failedResponse.status);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Processed callback test error:', error.message);
    return false;
  }
}

async function testCallbackUrls() {
  console.log('🚀 Testing Paymob Callback URLs...\n');
  
  const results = {
    responseCallback: false,
    processedCallback: false
  };
  
  // Test 1: Response Callback URL
  results.responseCallback = await testResponseCallback();
  
  // Test 2: Processed Callback URL
  results.processedCallback = await testProcessedCallback();
  
  // Summary
  console.log('\n📊 Callback Test Results:');
  console.log('========================');
  console.log(`Response Callback: ${results.responseCallback ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Processed Callback: ${results.processedCallback ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All callback tests passed!');
    console.log('\n📝 Next steps:');
    console.log('1. Configure these URLs in your Paymob dashboard');
    console.log('2. Test with real payment flow');
    console.log('3. Monitor webhook logs in production');
  } else {
    console.log('\n⚠️  Some callback tests failed.');
    console.log('\n🔧 To fix:');
    console.log('1. Make sure your server is running');
    console.log('2. Check that the routes exist');
    console.log('3. Verify the URLs are accessible');
  }
  
  return allPassed;
}

// Run tests if this script is executed directly
if (require.main === module) {
  testCallbackUrls()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Callback test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testResponseCallback,
  testProcessedCallback,
  testCallbackUrls
}; 