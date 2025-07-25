// Use built-in fetch (available in Node.js 18+)
const fetch = globalThis.fetch;

const BASE_URL = 'http://localhost:3001';

async function testPromoCodeValidation() {
  console.log('🧪 Testing Enhanced Promo Code System...\n');

  const testCases = [
    {
      name: 'Free Delivery Promo',
      code: 'FREEDEL',
      cartItems: [
        { product_id: 1, quantity: 2, price: 100, category: 'cookies', flavors: [{ name: 'chocolate' }] }
      ],
      subtotal: 100,
      expectedType: 'free_delivery'
    },
    {
      name: 'Category Specific Promo',
      code: 'CHOCO20',
      cartItems: [
        { product_id: 1, quantity: 1, price: 50, category: 'cookies', flavors: [{ name: 'chocolate' }] },
        { product_id: 2, quantity: 1, price: 30, category: 'cookies', flavors: [{ name: 'vanilla' }] }
      ],
      subtotal: 80,
      expectedType: 'category_specific'
    },
    {
      name: 'Buy X Get Y Promo',
      code: 'BUY2GET1',
      cartItems: [
        { product_id: 1, quantity: 3, price: 90, category: 'cookies', flavors: [{ name: 'chocolate' }] }
      ],
      subtotal: 90,
      expectedType: 'buy_x_get_y'
    },
    {
      name: 'First Time Customer Promo',
      code: 'WELCOME10',
      cartItems: [
        { product_id: 1, quantity: 1, price: 50, category: 'cookies', flavors: [{ name: 'chocolate' }] }
      ],
      subtotal: 50,
      expectedType: 'first_time_customer'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/validate-promo-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: testCase.code,
          customerId: null,
          customerEmail: 'test@example.com',
          cartItems: testCase.cartItems,
          subtotal: testCase.subtotal
        })
      });

      const result = await response.json();
      
      if (result.valid) {
        console.log(`✅ ${testCase.name} - Valid`);
        console.log(`   Type: ${result.promoCode.enhanced_type}`);
        console.log(`   Discount: ${result.promoCode.discount_amount} EGP`);
        console.log(`   Message: ${result.message}`);
        
        if (result.promoCode.enhanced_type === 'free_delivery') {
          console.log(`   Free Delivery: ${result.promoCode.free_delivery}`);
        }
        
        if (result.promoCode.enhanced_type === 'category_specific') {
          console.log(`   Eligible Items: ${result.promoCode.eligible_items?.length || 0}`);
        }
        
        if (result.promoCode.enhanced_type === 'buy_x_get_y') {
          console.log(`   Buy X Get Y Details:`, result.promoCode.buy_x_get_y_details);
        }
      } else {
        console.log(`❌ ${testCase.name} - Invalid: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} - Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// Test admin promo code creation
async function testAdminPromoCodeCreation() {
  console.log('🔧 Testing Admin Promo Code Creation...\n');

  const testPromoCode = {
    code: 'TESTFREE',
    name: 'Test Free Delivery',
    description: 'Test free delivery promo code',
    discount_type: 'percentage',
    enhanced_type: 'free_delivery',
    discount_value: 0,
    minimum_order_amount: 50,
    maximum_discount: 0,
    usage_limit: 100,
    valid_until: '2024-12-31',
    is_active: true,
    category_restrictions: '',
    product_restrictions: '',
    customer_group_restrictions: '',
    first_time_only: false,
    minimum_quantity: 0,
    maximum_quantity: 0,
    combination_allowed: false,
    stack_with_pricing_rules: false,
    buy_x_quantity: 0,
    get_y_quantity: 0,
    get_y_discount_percentage: 100,
    usage_per_customer: 1,
    usage_per_order: 1
  };

  try {
    const response = await fetch(`${BASE_URL}/api/admin/enhanced-promo-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPromoCode)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin promo code creation - Success');
      console.log(`   Created promo code: ${result.data.code}`);
    } else {
      console.log('❌ Admin promo code creation - Failed');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ Admin promo code creation - Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Enhanced Promo Code System Tests\n');
  
  // Wait a bit for the server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testPromoCodeValidation();
  await testAdminPromoCodeCreation();
  
  console.log('✨ Tests completed!');
}

runTests().catch(console.error); 