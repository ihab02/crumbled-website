import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('🍪 All cookies:', allCookies);
    
    const cookieData = allCookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value ? `${cookie.value.substring(0, 20)}...` : 'empty',
      hasValue: !!cookie.value
    }));
    
    return NextResponse.json({
      success: true,
      cookies: cookieData,
      cookieCount: allCookies.length,
      hasCartId: !!cookieStore.get('cart_id'),
      hasSession: !!cookieStore.get('next-auth.session-token'),
      hasSecureSession: !!cookieStore.get('__Secure-next-auth.session-token'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Debug cookies error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 