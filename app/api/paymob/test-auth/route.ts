import { NextRequest, NextResponse } from 'next/server';
import { paymobService } from '@/lib/services/paymobService';

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Testing Paymob authentication...');
    
    // Test authentication by getting an auth token
    const authToken = await paymobService.getAuthToken();
    
    return NextResponse.json({
      success: true,
      message: 'Paymob authentication successful',
      data: {
        authToken: authToken.substring(0, 10) + '...' // Only show first 10 chars for security
      }
    });
  } catch (error) {
    console.error('❌ Paymob authentication test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Paymob authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 