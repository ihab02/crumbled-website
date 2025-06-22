import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing environment variables...');
    
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const nodeEnv = process.env.NODE_ENV;
    const nextAuthSecret = process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set';
    
    console.log('🔍 NEXTAUTH_URL:', nextAuthUrl);
    console.log('🔍 NODE_ENV:', nodeEnv);
    console.log('🔍 NEXTAUTH_SECRET:', nextAuthSecret);
    
    return NextResponse.json({
      success: true,
      environment: {
        NEXTAUTH_URL: nextAuthUrl,
        NODE_ENV: nodeEnv,
        NEXTAUTH_SECRET: nextAuthSecret
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test env error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 