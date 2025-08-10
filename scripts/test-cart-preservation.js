#!/usr/bin/env node

/**
 * Cart Preservation Test Script
 * 
 * This script tests that the cart is preserved when Paymob payment fails
 */

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

async function addItemToCart() {
  console.log('🛒 Adding test item to cart...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: 1, // Assuming product ID 1 exists
        quantity: 1
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Item added to cart successfully');
      return true;
    } else {
      console.error('❌ Failed to add item to cart:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error adding item to cart:', error.message);
    return false;
  }
}

async function checkCartItems() {
  console.log('🔍 Checking cart items...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/cart`);
    const data = await response.json();
    
    if (response.ok) {
      const itemCount = data.items?.length || 0;
      console.log(`📋 Cart has ${itemCount} items`);
      return itemCount;
    } else {
      console.error('❌ Failed to check cart:', data);
      return 0;
    }
  } catch (error) {
    console.error('❌ Error checking cart:', error.message);
    return 0;
  }
}

async function testPaymobPaymentFailure() {
  console.log('💳 Testing Paymob payment with invalid credentials...');
  
  try {
    // Create a minimal order data structure
    const orderData = {
      cart: {
        items: [{
          id: 1,
          name: 'Test Product',
          basePrice: 100,
          quantity: 1,
          isPack: false,
          packSize: '',
          imageUrl: '',
          count: 1,
          flavorDetails: '',
          total: 100,
          flavors: []
        }],
        subtotal: 100,
        deliveryFee: 10,
        total: 110,
        itemCount: 1
      },
      deliveryAddress: {
        street_address: 'Test Address',
        city_name: 'Test City',
        zone_name: 'Test Zone',
        delivery_fee: 10
      },
      customerInfo: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890'
      },
      deliveryDate: '2024-12-25'
    };
    
    const paymentData = {
      paymentMethod: 'paymob',
      orderData
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
      console.log('✅ Paymob payment initiated successfully');
      console.log('📋 Payment URL:', data.data?.paymentUrl);
      return true;
    } else {
      console.log('❌ Paymob payment failed as expected (no valid credentials)');
      console.log('📋 Error:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing Paymob payment:', error.message);
    return false;
  }
}

async function runCartPreservationTest() {
  console.log('🚀 Starting Cart Preservation Test...\n');
  
  // Step 1: Add item to cart
  const itemAdded = await addItemToCart();
  if (!itemAdded) {
    console.log('❌ Cannot proceed without items in cart');
    return false;
  }
  
  // Step 2: Check cart before payment attempt
  const cartItemsBefore = await checkCartItems();
  if (cartItemsBefore === 0) {
    console.log('❌ No items in cart after adding');
    return false;
  }
  
  // Step 3: Attempt Paymob payment (should fail without credentials)
  const paymentResult = await testPaymobPaymentFailure();
  
  // Step 4: Check cart after payment attempt
  const cartItemsAfter = await checkCartItems();
  
  // Step 5: Verify cart preservation
  console.log('\n📊 Cart Preservation Test Results:');
  console.log('==================================');
  console.log(`Cart items before payment: ${cartItemsBefore}`);
  console.log(`Cart items after payment: ${cartItemsAfter}`);
  console.log(`Payment attempt result: ${paymentResult ? 'Success' : 'Failed (expected)'}`);
  
  if (cartItemsAfter === cartItemsBefore) {
    console.log('✅ Cart preserved successfully!');
    console.log('🎉 Cart items were not cleared when payment failed');
    return true;
  } else {
    console.log('❌ Cart was cleared when payment failed!');
    console.log('⚠️  This indicates a bug in the cart clearing logic');
    return false;
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  runCartPreservationTest()
    .then(success => {
      if (success) {
        console.log('\n🎉 Cart preservation test passed!');
        console.log('✅ The cart is now properly preserved when Paymob payment fails');
      } else {
        console.log('\n❌ Cart preservation test failed!');
        console.log('🔧 The cart clearing logic needs to be fixed');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  addItemToCart,
  checkCartItems,
  testPaymobPaymentFailure,
  runCartPreservationTest
}; 