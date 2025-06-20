import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/middleware/auth';
import { sessionManager } from '@/lib/session-manager';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, logoutAll = false } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Verify access token to get user info
    const payload = verifyJWT(accessToken);
    
    // Blacklist access token
    await sessionManager.blacklistToken(accessToken, 'access', 'logout');

    // Blacklist refresh token if provided
    if (refreshToken) {
      await sessionManager.blacklistToken(refreshToken, 'refresh', 'logout');
    }

    // Deactivate session(s)
    if (logoutAll) {
      // Deactivate all sessions for the user
      let userId: string;
      let userType: 'customer' | 'admin';
      
      if (payload.type === 'admin') {
        userId = payload.username;
        userType = 'admin';
      } else if (payload.type === 'customer') {
        userId = payload.id.toString();
        userType = 'customer';
      } else {
        // Refresh token - extract user info from session
        const session = await sessionManager.getSession(payload.sessionId);
        if (!session) {
          return NextResponse.json(
            { error: 'Invalid session' },
            { status: 401 }
          );
        }
        userId = session.userId;
        userType = session.userType;
      }
      
      await sessionManager.deactivateAllUserSessions(userId, userType);
    } else {
      // Deactivate only the current session
      await sessionManager.deactivateSession(payload.sessionId);
    }

    return NextResponse.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
} 