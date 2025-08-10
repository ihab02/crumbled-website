// TikTok Pixel Testing Script
// Paste this in your browser console to test events

console.log('🧪 TikTok Pixel Test Suite Starting...');

// Test 1: Check if pixel is loaded
if (typeof window.ttq !== 'undefined') {
    console.log('✅ TikTok Pixel is loaded correctly');
    
    // Test 2: Fire test events
    console.log('🔥 Firing test events...');
    
    // ViewContent
    window.ttq.track('ViewContent', {
        content_type: 'product',
        content_id: 'test_product',
        content_name: 'Test Product',
        currency: 'EGP',
        value: 200
    });
    console.log('✅ ViewContent event fired');
    
    // AddToCart
    window.ttq.track('AddToCart', {
        content_type: 'product',
        content_id: 'test_product',
        content_name: 'Test Product',
        currency: 'EGP',
        value: 200,
        quantity: 1
    });
    console.log('✅ AddToCart event fired');
    
    // InitiateCheckout
    window.ttq.track('InitiateCheckout', {
        content_type: 'product',
        currency: 'EGP',
        value: 200
    });
    console.log('✅ InitiateCheckout event fired');
    
    // CompletePayment
    window.ttq.track('CompletePayment', {
        content_type: 'product',
        currency: 'EGP',
        value: 200,
        content_id: 'test_order',
        content_name: 'Test Order'
    });
    console.log('✅ CompletePayment event fired');
    
    console.log('🎉 All test events completed successfully!');
    
} else {
    console.error('❌ TikTok Pixel not found! Check your installation.');
}

// Test 3: Monitor network requests
console.log('📡 Monitor the Network tab for TikTok requests...');
console.log('Look for requests to analytics.tiktok.com or business-api.tiktok.com');

// Test 4: Check for errors
window.addEventListener('error', function(e) {
    if (e.message.includes('ttq') || e.message.includes('tiktok')) {
        console.error('🚨 TikTok Pixel Error:', e.message);
    }
});

console.log('✅ Test suite complete. Check the Network tab and TikTok Events Manager.');