import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('🔍 Test session - Session data:', session);
    console.log('🔍 Test session - Session user:', session?.user);
    console.log('🔍 Test session - Session user email:', session?.user?.email);
    
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      session: session,
      user: session?.user,
      userEmail: session?.user?.email,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test session error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 