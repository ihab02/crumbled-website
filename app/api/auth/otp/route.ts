import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { cookies } from 'next/headers';
import { sendVerificationCode } from '@/lib/sms-service';

// This will be replaced with actual SMS gateway integration
const sendOTP = async (phone: string, otp: string) => {
  // TODO: Integrate with SMS gateway
  console.log(`Sending OTP ${otp} to ${phone}`);
  return true;
};

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if phone is already verified in session
    const cookieStore = cookies();
    const verifiedPhones = cookieStore.get('verified_phones');
    if (verifiedPhones) {
      const phones = JSON.parse(verifiedPhones.value);
      if (phones.includes(phone)) {
        return NextResponse.json({ message: 'Phone number already verified' });
      }
    }

    // Check if phone belongs to a registered customer
    const [customerResult] = await databaseService.query(
      'SELECT id FROM customers WHERE phone = ?',
      [phone]
    );

    if (Array.isArray(customerResult) && customerResult.length > 0) {
      // Phone belongs to a registered customer, no need for OTP
      const phones = verifiedPhones ? JSON.parse(verifiedPhones.value) : [];
      phones.push(phone);
      cookieStore.set('verified_phones', JSON.stringify(phones), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });
      return NextResponse.json({ message: 'Phone number verified (registered customer)' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔑 Generated OTP:', otp);
    
    // Set expiration time (10 minutes from now) in MySQL format
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    const mysqlExpiresAt = expiresAt.toISOString().slice(0, 19).replace('T', ' ');
    console.log('⏰ Expires at:', mysqlExpiresAt);

    // Send OTP via SMS (this will also store it in database)
    const smsResult = await sendVerificationCode(phone, otp);

    if (!smsResult.success) {
      console.error('SMS sending failed');
      // For development/testing, return the OTP in the response
      return NextResponse.json({
        message: 'OTP generated (SMS service configuration issue)',
        debug: {
          otp,
          note: 'OTP displayed due to SMS service configuration issues'
        }
      });
    }

    // In development mode, also return the OTP for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 [DEV MODE] OTP for testing:', otp);
      return NextResponse.json({ 
        message: 'OTP sent successfully',
        debug: {
          otp,
          note: 'OTP displayed for development testing'
        }
      });
    }

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { phone, otp } = await request.json();
    console.log('🔍 Verifying OTP:', { phone, otp });

    if (!phone || !otp) {
      console.log('❌ Missing phone or OTP');
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Check if phone belongs to a registered customer
    const [customerResult] = await databaseService.query(
      'SELECT id, type FROM customers WHERE phone = ?',
      [phone]
    );

    const isRegisteredCustomer = Array.isArray(customerResult) && customerResult.length > 0 && customerResult[0].type === 'registered';

    if (isRegisteredCustomer) {
      console.log('✅ Phone belongs to registered customer - skipping OTP verification');
      // Phone belongs to a registered customer, no need for OTP
      const cookieStore = cookies();
      const verifiedPhones = cookieStore.get('verified_phones');
      const phones = verifiedPhones ? JSON.parse(verifiedPhones.value) : [];
      phones.push(phone);
      cookieStore.set('verified_phones', JSON.stringify(phones), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });
      return NextResponse.json({ message: 'Phone number verified (registered customer)' });
    }

    // For guest users, always verify the OTP regardless of previous verification
    console.log('🔍 Guest user - always verifying OTP');
    
    // Verify OTP
    console.log('🔍 Checking OTP in database...');
    console.log('📱 Phone:', phone);
    console.log('🔑 OTP:', otp);
    
    // Format phone number to match what's stored in database
    const formattedPhone = phone.replace(/\D/g, "");
    console.log('📱 Formatted phone:', formattedPhone);
    
    try {
      // Step 1: Get the LATEST OTP for this phone (most recent one)
      const [latestOtpResult] = await databaseService.query(
        'SELECT id, phone, verification_code, created_at, expires_at, is_verified FROM phone_verification WHERE phone = ? ORDER BY created_at DESC LIMIT 1',
        [formattedPhone]
      );
      
      const latestOtp = Array.isArray(latestOtpResult) ? latestOtpResult[0] : latestOtpResult;
      
      if (!latestOtp) {
        console.log('❌ No OTP found for this phone');
        return NextResponse.json(
          { error: 'Invalid or expired OTP' },
          { status: 400 }
        );
      }
      
      console.log('🔍 Latest OTP record:', latestOtp);
      console.log('🔍 Expected OTP:', latestOtp.verification_code);
      console.log('🔍 Provided OTP:', otp);
      
      // Step 2: Check if the provided OTP matches the latest one
      if (latestOtp.verification_code !== otp) {
        console.log('❌ OTP does not match the latest one');
        return NextResponse.json(
          { error: 'Invalid or expired OTP' },
          { status: 400 }
        );
      }
      
      // Step 3: Check if the latest OTP is already verified
      if (latestOtp.is_verified) {
        console.log('❌ OTP has already been verified');
        return NextResponse.json(
          { error: 'OTP has already been used' },
          { status: 400 }
        );
      }
      
      // Step 4: Check if OTP is expired
      const now = new Date();
      const expiresAt = new Date(latestOtp.expires_at);
      
      console.log('⏰ Current time:', now.toISOString());
      console.log('⏰ Expires at:', expiresAt.toISOString());
      console.log('⏰ Is expired:', now > expiresAt);
      
      if (now > expiresAt) {
        console.log('❌ OTP has expired');
        return NextResponse.json(
          { error: 'OTP has expired' },
          { status: 400 }
        );
      }

      // Step 5: Mark OTP as verified
      console.log('✅ Marking OTP as verified');
      const updateQuery = 'UPDATE phone_verification SET is_verified = true WHERE id = ?';
      console.log('📝 Update query:', updateQuery);
      console.log('🔢 Update params:', [latestOtp.id]);
      
      await databaseService.query(updateQuery, [latestOtp.id]);
      console.log('✅ OTP marked as verified');
    } catch (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    // Add phone to verified phones in session
    const cookieStore = cookies();
    const verifiedPhones = cookieStore.get('verified_phones');
    const phones = verifiedPhones ? JSON.parse(verifiedPhones.value) : [];
    phones.push(phone);
    cookieStore.set('verified_phones', JSON.stringify(phones), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    console.log('✅ OTP verification successful');
    return NextResponse.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
} 