import { NextRequest, NextResponse } from 'next/server';
import { kitchenAuthService } from '@/lib/services/kitchenAuthService';

/**
 * GET /api/kitchen/auth/session
 * Get current kitchen session
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('kitchen-session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const sessionResult = await kitchenAuthService.getSession(sessionToken);
    
    if (!sessionResult.success) {
      return NextResponse.json(
        { error: sessionResult.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: sessionResult.user,
        selectedKitchen: sessionResult.selectedKitchen,
        permissions: sessionResult.permissions,
        sessionExpiry: sessionResult.sessionExpiry
      }
    });

  } catch (error) {
    console.error('Error getting kitchen session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/kitchen/auth/session
 * Switch kitchen for current user
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('kitchen-session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { kitchenId } = body;

    if (!kitchenId) {
      return NextResponse.json(
        { error: 'Kitchen ID is required' },
        { status: 400 }
      );
    }

    const switchResult = await kitchenAuthService.switchKitchen(sessionToken, kitchenId);
    
    if (!switchResult.success) {
      return NextResponse.json(
        { error: switchResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        selectedKitchen: switchResult.selectedKitchen,
        permissions: switchResult.permissions
      }
    });

  } catch (error) {
    console.error('Error switching kitchen:', error);
    return NextResponse.json(
      { error: 'Failed to switch kitchen' },
      { status: 500 }
    );
  }
} 