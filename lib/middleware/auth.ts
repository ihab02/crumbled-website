import { NextRequest, NextResponse } from 'next/server';
import { createHmac, randomBytes } from 'crypto';
import { getJwtSecret, authConfig } from '@/lib/auth-config';

// Types for JWT payload
interface AdminPayload {
  type: 'admin';
  username: string;
  email: string;
  sessionId: string;
}

interface CustomerPayload {
  type: 'customer';
  id: number;
  email: string;
  sessionId: string;
}

interface RefreshPayload {
  type: 'refresh';
  userId: string;
  userType: 'customer' | 'admin';
  sessionId: string;
}

type JWTPayload = AdminPayload | CustomerPayload | RefreshPayload;

// Generate JWT token with separate secrets
export function generateToken(payload: JWTPayload): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const expiry = payload.type === 'refresh' 
    ? now + authConfig.refreshTokenExpiry
    : payload.type === 'admin' 
      ? now + authConfig.adminTokenExpiry 
      : now + authConfig.customerTokenExpiry;

  const finalPayload = {
    ...payload,
    iat: now,
    exp: expiry
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(finalPayload)).toString('base64url');

  const secret = getJwtSecret(payload.type === 'admin' ? 'admin' : 'customer');
  const signature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Generate refresh token
export function generateRefreshToken(userId: string, userType: 'customer' | 'admin', sessionId: string): string {
  return generateToken({
    type: 'refresh',
    userId,
    userType,
    sessionId
  });
}

// Verify JWT token
export function verifyJWT(token: string, expectedType?: 'customer' | 'admin' | 'refresh'): JWTPayload {
  const [encodedHeader, encodedPayload, signature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Invalid token format');
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
  
  // Determine secret based on payload type
  const secret = getJwtSecret(payload.type === 'admin' ? 'admin' : 'customer');
  
  const expectedSignature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature');
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token has expired');
  }

  // Verify expected type if provided
  if (expectedType && payload.type !== expectedType) {
    throw new Error(`Expected token type ${expectedType}, got ${payload.type}`);
  }

  return payload;
}

// Generate session ID
export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

// Middleware for admin-only routes
export async function adminAuth(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyJWT(token, 'admin') as AdminPayload;

    // Add the admin info to the request for use in the route handler
    req.headers.set('x-admin-username', payload.username);
    req.headers.set('x-admin-email', payload.email);
    req.headers.set('x-session-id', payload.sessionId);

    return null; // Continue to the route handler
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid or expired token' },
      { status: 401 }
    );
  }
}

// Middleware for customer-only routes
export async function customerAuth(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyJWT(token, 'customer') as CustomerPayload;

    // Add the customer info to the request for use in the route handler
    req.headers.set('x-customer-id', payload.id.toString());
    req.headers.set('x-customer-email', payload.email);
    req.headers.set('x-session-id', payload.sessionId);

    return null; // Continue to the route handler
  } catch (error) {
    console.error('Customer auth error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid or expired token' },
      { status: 401 }
    );
  }
} 