const mysql = require('mysql2/promise');

async function testOTPTimezone() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Goodmorning@1',
      database: process.env.DB_NAME || 'crumbled_nextDB'
    });

    console.log('🔍 Testing OTP timezone functionality...');

    // Test 1: Check current timezone settings
    const [timezoneResult] = await connection.query('SELECT @@global.time_zone, @@session.time_zone, NOW() as current_time, UTC_TIMESTAMP() as utc_time');
    console.log('🌍 Timezone Info:', timezoneResult[0]);

    // Test 2: Set timezone to UTC for testing
    await connection.execute('SET time_zone = "+00:00"');
    console.log('✅ Set timezone to UTC');

    // Test 3: Check timezone after setting
    const [timezoneAfter] = await connection.query('SELECT @@session.time_zone, NOW() as current_time, UTC_TIMESTAMP() as utc_time');
    console.log('🌍 Timezone after setting:', timezoneAfter[0]);

    // Test 4: Test OTP insertion with UTC
    const testPhone = '01271211171';
    const testOTP = '123456';
    
    console.log(`📱 Testing OTP insertion for phone: ${testPhone}`);
    
    const [insertResult] = await connection.query(
      'INSERT INTO phone_verification (phone, verification_code, expires_at) VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL 10 MINUTE)',
      [testPhone, testOTP]
    );
    
    console.log('✅ OTP inserted with ID:', insertResult.insertId);

    // Test 5: Check the inserted OTP
    const [otpCheck] = await connection.query(
      `SELECT 
        id,
        phone,
        verification_code,
        expires_at,
        UTC_TIMESTAMP() as current_utc_time,
        TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), expires_at) as minutes_until_expiry
      FROM phone_verification
      WHERE id = ?`,
      [insertResult.insertId]
    );
    
    console.log('🔑 Inserted OTP details:', otpCheck[0]);

    // Test 6: Test OTP verification query
    const [verificationResult] = await connection.query(
      `SELECT 
        id,
        verification_code,
        expires_at,
        is_verified
      FROM phone_verification
      WHERE phone = ?
        AND verification_code = ?
        AND expires_at > UTC_TIMESTAMP()
        AND is_verified = false
      ORDER BY created_at DESC
      LIMIT 1`,
      [testPhone, testOTP]
    );

    console.log('✅ Verification query result:', verificationResult);

    // Test 7: Clean up test OTP
    await connection.query('DELETE FROM phone_verification WHERE id = ?', [insertResult.insertId]);
    console.log('🧹 Cleaned up test OTP');

    // Test 8: Check existing OTPs for the test phone
    const [existingOtps] = await connection.query(
      `SELECT 
        id,
        verification_code,
        expires_at,
        is_verified,
        UTC_TIMESTAMP() as current_utc_time,
        TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), expires_at) as minutes_until_expiry
      FROM phone_verification
      WHERE phone = ?
      ORDER BY created_at DESC
      LIMIT 3`,
      [testPhone]
    );

    console.log('📱 Existing OTPs for test phone:', existingOtps);

    console.log('🎉 OTP timezone test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing OTP timezone:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testOTPTimezone(); 