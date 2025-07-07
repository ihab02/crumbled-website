import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, generateToken, generateRefreshToken } from '@/lib/middleware/auth';
import { sessionManager } from '@/lib/session-manager';
import { authConfig } from '@/lib/auth-config';

interface RefreshPayload {
  type: 'refresh';
  userId: string;
  userType: 'customer' | 'admin';
  sessionId: string;
  iat: number;
  exp: number;
}

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Check if token is blacklisted
    if (await sessionManager.isTokenBlacklisted(refreshToken)) {
      return NextResponse.json(
        { error: 'Token has been revoked' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const payload = verifyJWT(refreshToken, 'refresh') as RefreshPayload;
    
    // Get session
    const session = await sessionManager.getSession(payload.sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Verify session matches token
    if (session.userId !== payload.userId || session.userType !== payload.userType) {
      return NextResponse.json(
        { error: 'Session mismatch' },
        { status: 401 }
      );
    }

    // Generate new access token
    let newAccessToken: string;
    if (payload.userType === 'admin') {
      newAccessToken = generateToken({
        type: 'admin',
        id: parseInt(session.userId), // Convert userId to number for admin
        username: session.userId,
        email: session.userId,
        sessionId: payload.sessionId
      });
    } else {
      newAccessToken = generateToken({
        type: 'customer',
        id: parseInt(payload.userId),
        email: session.userId,
        sessionId: payload.sessionId
      });
    }

    // Generate new refresh token
    const newRefreshToken = generateRefreshToken(payload.userId, payload.userType, payload.sessionId);

    // Update session with new refresh token
    await sessionManager.updateSessionRefreshToken(payload.sessionId, newRefreshToken);

    // Blacklist old refresh token
    await sessionManager.blacklistToken(refreshToken, 'refresh', 'security');

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: payload.userType === 'admin' 
        ? authConfig.adminTokenExpiry 
        : authConfig.customerTokenExpiry
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    );
  }
} 