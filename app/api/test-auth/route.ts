import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing authentication systems...');
    
    // Check NextAuth session
    const nextAuthSession = await getServerSession(authOptions);
    console.log('🔍 NextAuth session:', nextAuthSession);
    
    // Check custom JWT tokens
    const cookieStore = cookies();
    const customerToken = cookieStore.get('token');
    const adminToken = cookieStore.get('adminToken');
    const nextAuthToken = cookieStore.get('next-auth.session-token');
    
    console.log('🔍 Custom customer token:', customerToken?.value ? 'Present' : 'Not found');
    console.log('🔍 Custom admin token:', adminToken?.value ? 'Present' : 'Not found');
    console.log('🔍 NextAuth token:', nextAuthToken?.value ? 'Present' : 'Not found');
    
    // Get all cookies for debugging
    const allCookies = cookieStore.getAll();
    console.log('🔍 All cookies:', allCookies.map(c => ({ name: c.name, value: c.value ? 'Present' : 'Not found' })));
    
    return NextResponse.json({
      success: true,
      nextAuth: {
        session: nextAuthSession,
        hasSession: !!nextAuthSession,
        hasUser: !!nextAuthSession?.user,
        user: nextAuthSession?.user
      },
      customAuth: {
        customerToken: customerToken?.value ? 'Present' : 'Not found',
        adminToken: adminToken?.value ? 'Present' : 'Not found',
        nextAuthToken: nextAuthToken?.value ? 'Present' : 'Not found'
      },
      allCookies: allCookies.map(c => c.name),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test auth error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 