import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone parameter is required' }, { status: 400 });
    }

    // Format phone number the same way as in the OTP API
    const formattedPhone = phone.replace(/\D/g, "");
    
    console.log('🔍 [DEBUG] Checking OTPs for phone:', phone);
    console.log('🔍 [DEBUG] Formatted phone:', formattedPhone);

    // Get all OTPs for this phone
    const [result] = await databaseService.query(
      'SELECT id, phone, verification_code, created_at, expires_at, is_verified FROM phone_verification WHERE phone = ? ORDER BY created_at DESC',
      [formattedPhone]
    );

    console.log('📊 [DEBUG] Database result:', result);

    return NextResponse.json({
      phone: phone,
      formattedPhone: formattedPhone,
      otps: result,
      count: Array.isArray(result) ? result.length : 0
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
} 