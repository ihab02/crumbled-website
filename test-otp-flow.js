const testOtpFlow = async () => {
  try {
    console.log('🧪 Testing OTP validation flow...');
    
    const testPhone = '01271211171'; // Use a phone number from the database
    
    // Step 1: Send OTP
    console.log('\n📤 Step 1: Sending OTP...');
    const sendResponse = await fetch('http://localhost:3001/api/checkout/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: testPhone })
    });
    
    const sendResult = await sendResponse.json();
    console.log('📥 Send OTP response:', sendResult);
    
    if (!sendResponse.ok) {
      console.error('❌ Failed to send OTP');
      return;
    }
    
    // Get the OTP from the response (in development mode)
    const otpCode = sendResult.debug?.otp;
    if (!otpCode) {
      console.error('❌ No OTP in response');
      return;
    }
    
    console.log('🔑 OTP Code:', otpCode);
    
    // Step 2: Verify OTP
    console.log('\n🔍 Step 2: Verifying OTP...');
    const verifyResponse = await fetch('http://localhost:3001/api/auth/otp', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        phone: testPhone, 
        otp: otpCode 
      })
    });
    
    const verifyResult = await verifyResponse.json();
    console.log('📥 Verify OTP response:', verifyResult);
    
    if (verifyResponse.ok) {
      console.log('✅ OTP verification successful!');
    } else {
      console.error('❌ OTP verification failed:', verifyResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testOtpFlow(); 