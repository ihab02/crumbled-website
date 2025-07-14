import { NextRequest, NextResponse } from 'next/server';
import { kitchenAuthService } from '@/lib/services/kitchenAuthService';

/**
 * POST /api/kitchen/auth/logout
 * Kitchen user logout
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('kitchen-session')?.value;
    
    if (sessionToken) {
      await kitchenAuthService.logout(sessionToken);
    }

    // Clear session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.set('kitchen-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Error during kitchen logout:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
} 