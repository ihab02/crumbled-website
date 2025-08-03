const mysql = require('mysql2/promise');

async function testTimezone() {
  let connection;
  try {
    // Create connection with timezone
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Goodmorning@1',
      database: process.env.DB_NAME || 'crumbled_nextDB',
      timezone: '+03:00',
      dateStrings: false
    });

    console.log('🔍 Testing timezone configuration...');

    // Test 1: Check MySQL server timezone
    const [timezoneResult] = await connection.query('SELECT @@global.time_zone, @@session.time_zone, NOW() as current_time');
    console.log('🌍 MySQL Timezone Info:', timezoneResult[0]);

    // Test 2: Check server timezone
    const [serverResult] = await connection.query('SELECT @@system_time_zone as system_timezone');
    console.log('🖥️ Server Timezone:', serverResult[0]);

    // Test 3: Test OTP expiration logic
    const testPhone = '01271211171';
    console.log(`📱 Testing OTP for phone: ${testPhone}`);

    // Get recent OTPs
    const [otps] = await connection.query(
      `SELECT 
        id,
        verification_code,
        expires_at,
        is_verified,
        created_at,
        NOW() as current_mysql_time,
        TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_until_expiry
      FROM phone_verification
      WHERE phone = ?
      ORDER BY created_at DESC
      LIMIT 3`,
      [testPhone]
    );

    console.log('🔑 Recent OTPs:', otps);

    // Test 4: Check if any OTPs are valid
    const [validOtps] = await connection.query(
      `SELECT 
        id,
        verification_code,
        expires_at,
        is_verified
      FROM phone_verification
      WHERE phone = ?
        AND expires_at > NOW()
        AND is_verified = false
      ORDER BY created_at DESC
      LIMIT 1`,
      [testPhone]
    );

    console.log('✅ Valid OTPs:', validOtps);

    // Test 5: Check timezone conversion
    const [timeTest] = await connection.query(
      `SELECT 
        NOW() as mysql_now,
        UTC_TIMESTAMP() as utc_time,
        CONVERT_TZ(NOW(), '+00:00', '+03:00') as converted_time
      `
    );
    console.log('⏰ Time Tests:', timeTest[0]);

  } catch (error) {
    console.error('❌ Error testing timezone:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testTimezone(); 