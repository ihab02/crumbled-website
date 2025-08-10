#!/usr/bin/env node

/**
 * Paymob Checkout Test Script
 * 
 * This script simulates the exact checkout flow that fails when using Paymob
 */

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

async function testCheckoutConfirm() {
  console.log('🔍 Testing Checkout Confirm API...');
  
  try {
    // Simulate the exact request data from the frontend
    const confirmData = {
      guestData: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        address: 'Test Address',
        city: 'Test City',
        zone: 'Test Zone',
        additionalInfo: 'Test Additional Info'
      },
      deliveryDate: '2024-12-25',
      promoCode: undefined
    };
    
    const response = await fetch(`${BASE_URL}/api/checkout/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(confirmData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Checkout confirm test passed');
      console.log('📋 Order data:', data.data);
      return data.data;
    } else {
      console.error('❌ Checkout confirm test failed:', response.status);
      console.error('📋 Error response:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Checkout confirm test error:', error.message);
    return null;
  }
}

async function testPaymobPayment(orderData) {
  console.log('\n💳 Testing Paymob Payment API...');
  
  try {
    const paymentData = {
      paymentMethod: 'paymob',
      orderData: {
        ...orderData,
        deliveryDate: '2024-12-25'
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/checkout/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Paymob payment test passed');
      console.log('📋 Payment response:', data);
      return data;
    } else {
      console.error('❌ Paymob payment test failed:', response.status);
      console.error('📋 Error response:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Paymob payment test error:', error.message);
    return null;
  }
}

async function testCartData() {
  console.log('\n🛒 Testing Cart Data...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/cart`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Cart data test passed');
      console.log('📋 Cart items count:', data.items?.length || 0);
      console.log('📋 Cart total:', data.total);
      return data;
    } else {
      console.error('❌ Cart data test failed:', response.status);
      console.error('📋 Error response:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Cart data test error:', error.message);
    return null;
  }
}

async function runPaymobCheckoutTest() {
  console.log('🚀 Starting Paymob Checkout Flow Test...\n');
  
  // Step 1: Check cart data
  const cartData = await testCartData();
  if (!cartData || !cartData.items || cartData.items.length === 0) {
    console.log('⚠️  No items in cart. Please add items to cart first.');
    console.log('💡 You can add items through the website interface.');
    return false;
  }
  
  // Step 2: Test checkout confirm
  const orderData = await testCheckoutConfirm();
  if (!orderData) {
    console.log('❌ Checkout confirm failed. Cannot proceed with payment test.');
    return false;
  }
  
  // Step 3: Test Paymob payment
  const paymentResult = await testPaymobPayment(orderData);
  if (!paymentResult) {
    console.log('❌ Paymob payment failed.');
    return false;
  }
  
  console.log('\n🎉 Paymob checkout flow test completed successfully!');
  console.log('📋 Payment URL:', paymentResult.data?.paymentUrl);
  
  return true;
}

// Run test if this script is executed directly
if (require.main === module) {
  runPaymobCheckoutTest()
    .then(success => {
      if (!success) {
        console.log('\n🔧 Troubleshooting:');
        console.log('- Make sure you have items in your cart');
        console.log('- Check that the development server is running');
        console.log('- Verify Paymob credentials are set in .env.local');
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
  testCheckoutConfirm,
  testPaymobPayment,
  testCartData,
  runPaymobCheckoutTest
}; 