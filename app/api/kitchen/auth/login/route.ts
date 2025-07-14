import { NextRequest, NextResponse } from 'next/server';
import { kitchenAuthService } from '@/lib/services/kitchenAuthService';

/**
 * POST /api/kitchen/auth/login
 * Kitchen user login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, kitchenId } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const loginResult = await kitchenAuthService.login(username, password, kitchenId);
    
    if (!loginResult.success) {
      return NextResponse.json(
        { error: loginResult.error },
        { status: 401 }
      );
    }

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: loginResult.user,
        availableKitchens: loginResult.availableKitchens,
        selectedKitchen: loginResult.selectedKitchen,
        permissions: loginResult.permissions
      }
    });

    // Set secure session cookie
    response.cookies.set('kitchen-session', loginResult.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Error during kitchen login:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
} 