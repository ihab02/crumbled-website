import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone parameter required' }, { status: 400 });
    }

    const formattedPhone = phone.replace(/\D/g, "");
    
    console.log('🔍 Debug OTP Status for phone:', formattedPhone);

    // Check current timezone settings
    const [timezoneResult] = await databaseService.query(
      'SELECT @@global.time_zone, @@session.time_zone, NOW() as current_time, UTC_TIMESTAMP() as utc_time'
    );

    // Get recent OTPs for this phone
    const [otps] = await databaseService.query(
      `SELECT 
        id,
        phone,
        verification_code,
        expires_at,
        is_verified,
        created_at,
        NOW() as current_mysql_time,
        UTC_TIMESTAMP() as current_utc_time,
        TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_until_expiry_mysql,
        TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), expires_at) as minutes_until_expiry_utc
      FROM phone_verification
      WHERE phone = ?
      ORDER BY created_at DESC
      LIMIT 5`,
      [formattedPhone]
    );

    // Check if any OTPs are valid with different timezone approaches
    const [validWithNow] = await databaseService.query(
      `SELECT COUNT(*) as count
       FROM phone_verification
       WHERE phone = ?
         AND expires_at > NOW()
         AND is_verified = false`,
      [formattedPhone]
    );

    const [validWithUTC] = await databaseService.query(
      `SELECT COUNT(*) as count
       FROM phone_verification
       WHERE phone = ?
         AND expires_at > UTC_TIMESTAMP()
         AND is_verified = false`,
      [formattedPhone]
    );

    return NextResponse.json({
      phone: formattedPhone,
      timezone: timezoneResult[0],
      recentOtps: otps,
      validOtpsWithNow: validWithNow[0].count,
      validOtpsWithUTC: validWithUTC[0].count,
      serverTime: new Date().toISOString(),
      debug: {
        note: 'This endpoint shows OTP status and timezone information for debugging'
      }
    });

  } catch (error) {
    console.error('❌ Debug OTP Status Error:', error);
    return NextResponse.json(
      { error: 'Failed to get OTP status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 