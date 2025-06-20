import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    // Test database connection
    const [result] = await databaseService.query('SELECT NOW() as current_time');
    console.log('✅ Database connection test:', result);

    // Test phone_verification table
    const [otpResult] = await databaseService.query(
      'SELECT COUNT(*) as count FROM phone_verification'
    );
    console.log('✅ Phone verification table test:', otpResult);

    // Test inserting a test OTP
    const testPhone = '01271211171';
    const testOtp = '123456';
    
    const [insertResult] = await databaseService.query(
      'INSERT INTO phone_verification (phone, verification_code, expires_at) VALUES (?, ?, NOW() + INTERVAL 10 MINUTE)',
      [testPhone, testOtp]
    );
    console.log('✅ Test OTP insert result:', insertResult);

    // Test retrieving the test OTP
    const [retrieveResult] = await databaseService.query(
      'SELECT * FROM phone_verification WHERE phone = ? AND verification_code = ?',
      [testPhone, testOtp]
    );
    console.log('✅ Test OTP retrieve result:', retrieveResult);

    // Clean up test OTP
    await databaseService.query(
      'DELETE FROM phone_verification WHERE phone = ? AND verification_code = ?',
      [testPhone, testOtp]
    );

    return NextResponse.json({
      success: true,
      message: 'Database test completed successfully',
      data: {
        currentTime: result,
        otpCount: otpResult,
        insertResult,
        retrieveResult
      }
    });
  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
