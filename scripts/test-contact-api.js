// Test script for contact API
const testContactAPI = async () => {
  try {
    const testMessage = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      subject: 'Test Message',
      message: 'This is a test message to verify the contact API is working.'
    };

    console.log('Testing contact API...');
    console.log('Sending test message:', testMessage);

    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage),
    });

    const result = await response.json();
    console.log('Response:', result);

    if (result.success) {
      console.log('✅ Contact API test passed!');
    } else {
      console.log('❌ Contact API test failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Contact API test failed with error:', error);
  }
};

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  testContactAPI();
}

module.exports = { testContactAPI }; 