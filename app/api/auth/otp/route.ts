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

    // Store OTP in database
    console.log('💾 Storing OTP in database...');
    const insertQuery = 'INSERT INTO phone_verification (phone, verification_code, expires_at) VALUES (?, ?, ?)';
    console.log('📝 Insert query:', insertQuery);
    console.log('🔢 Insert params:', [phone, otp, mysqlExpiresAt]);
    
    try {
      await databaseService.query(insertQuery, [phone, otp, mysqlExpiresAt]);
      console.log('✅ OTP stored successfully');
    } catch (error) {
      console.error('❌ Error storing OTP:', error);
      throw error;
    }

    // Send OTP via SMS
    const smsResult = await sendVerificationCode(phone);

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

    // Check if phone is already verified in session
    const cookieStore = cookies();
    const verifiedPhones = cookieStore.get('verified_phones');
    if (verifiedPhones) {
      const phones = JSON.parse(verifiedPhones.value);
      if (phones.includes(phone)) {
        console.log('✅ Phone already verified in session');
        return NextResponse.json({ message: 'Phone number already verified' });
      }
    }

    // Check if phone belongs to a registered customer
    const [customerResult] = await databaseService.query(
      'SELECT id FROM customers WHERE phone = ?',
      [phone]
    );

    if (Array.isArray(customerResult) && customerResult.length > 0) {
      console.log('✅ Phone belongs to registered customer');
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

    // Verify OTP
    console.log('🔍 Checking OTP in database...');
    console.log('📱 Phone:', phone);
    console.log('🔑 OTP:', otp);
    
    const query = `SELECT * FROM phone_verification
       WHERE phone = ? AND verification_code = ? AND is_verified = false
       AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`;
    console.log('📝 Query:', query);
    console.log('🔢 Params:', [phone, otp]);
    
    try {
      const [result] = await databaseService.query(query, [phone, otp]);
      console.log('📊 Raw database result:', result);

      if (!Array.isArray(result) || result.length === 0) {
        console.log('❌ Invalid or expired OTP');
        return NextResponse.json(
          { error: 'Invalid or expired OTP' },
          { status: 400 }
        );
      }

      // Mark OTP as verified
      console.log('✅ Marking OTP as verified');
      const updateQuery = 'UPDATE phone_verification SET is_verified = true WHERE phone = ? AND verification_code = ?';
      console.log('📝 Update query:', updateQuery);
      console.log('🔢 Update params:', [phone, otp]);
      
      await databaseService.query(updateQuery, [phone, otp]);
      console.log('✅ OTP marked as verified');
    } catch (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    // Add phone to verified phones in session
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