import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Clearing all authentication cookies...');
    
    const response = NextResponse.json({
      success: true,
      message: 'All authentication cookies cleared',
      timestamp: new Date().toISOString()
    });

    // Clear all possible authentication cookies
    const cookieNames = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      'token', // Custom JWT token
      'adminToken', // Admin JWT token
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token',
      '__Secure-next-auth.callback-url'
    ];

    cookieNames.forEach(name => {
      response.cookies.delete(name);
      console.log(`🧹 Cleared cookie: ${name}`);
    });

    return response;

  } catch (error) {
    console.error('❌ Clear auth error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 