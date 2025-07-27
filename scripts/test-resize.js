// Test script to help debug resize functionality
// Run this in the browser console when on the popup admin page

console.log('🧪 Popup Resize Test Script Loaded');

// Test function to check if resize elements exist
function testResizeElements() {
  console.log('🔍 Testing resize elements...');
  
  // Check if resize handle exists
  const resizeHandle = document.querySelector('[title="Drag to resize"]');
  if (resizeHandle) {
    console.log('✅ Resize handle found:', resizeHandle);
    console.log('📍 Position:', resizeHandle.getBoundingClientRect());
  } else {
    console.log('❌ Resize handle not found');
  }
  
  // Check if preview container exists
  const previewContainer = document.querySelector('.fixed.inset-0.bg-black');
  if (previewContainer) {
    console.log('✅ Preview container found:', previewContainer);
  } else {
    console.log('❌ Preview container not found');
  }
  
  // Check if dimensions display exists
  const dimensionsDisplay = document.querySelector('[class*="bg-gray-800"]');
  if (dimensionsDisplay) {
    console.log('✅ Dimensions display found:', dimensionsDisplay);
    console.log('📏 Current dimensions:', dimensionsDisplay.textContent);
  } else {
    console.log('❌ Dimensions display not found');
  }
}

// Test function to simulate resize
function simulateResize() {
  console.log('🎮 Simulating resize...');
  
  const resizeHandle = document.querySelector('[title="Drag to resize"]');
  if (!resizeHandle) {
    console.log('❌ Resize handle not found for simulation');
    return;
  }
  
  // Create and dispatch mouse events
  const mouseDownEvent = new MouseEvent('mousemove', {
    clientX: 100,
    clientY: 100,
    bubbles: true,
    cancelable: true
  });
  
  const mouseMoveEvent = new MouseEvent('mousemove', {
    clientX: 200,
    clientY: 200,
    bubbles: true,
    cancelable: true
  });
  
  const mouseUpEvent = new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true
  });
  
  console.log('🖱️ Dispatching mouse events...');
  resizeHandle.dispatchEvent(mouseDownEvent);
  document.dispatchEvent(mouseMoveEvent);
  document.dispatchEvent(mouseUpEvent);
}

// Test function to check event listeners
function checkEventListeners() {
  console.log('🎧 Checking event listeners...');
  
  // Check if global event listeners are attached
  const hasMouseMoveListener = document.onmousemove !== null;
  const hasMouseUpListener = document.onmouseup !== null;
  
  console.log('Global mouse move listener:', hasMouseMoveListener ? '✅ Attached' : '❌ Not attached');
  console.log('Global mouse up listener:', hasMouseUpListener ? '✅ Attached' : '❌ Not attached');
}

// Export test functions
window.testResizeElements = testResizeElements;
window.simulateResize = simulateResize;
window.checkEventListeners = checkEventListeners;

console.log('📋 Available test functions:');
console.log('- testResizeElements() - Check if resize elements exist');
console.log('- simulateResize() - Simulate resize events');
console.log('- checkEventListeners() - Check event listener status');

// Auto-run basic test
setTimeout(() => {
  console.log('🔄 Auto-running basic test...');
  testResizeElements();
}, 1000); 