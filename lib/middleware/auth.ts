import { NextRequest, NextResponse } from 'next/server';
import { createHmac, randomBytes } from 'crypto';

// Types for JWT payload
interface AdminPayload {
  type: 'admin';
  username: string;
  email: string;
}

interface CustomerPayload {
  type: 'customer';
  id: number;
  email: string;
}

type JWTPayload = AdminPayload | CustomerPayload;

// Secret key for JWT signing (in production, use a secure environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (60 * 60 * 24); // 24 hours

  const finalPayload = {
    ...payload,
    iat: now,
    exp
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(finalPayload)).toString('base64url');

  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify JWT token
export function verifyJWT(token: string): JWTPayload {
  const [encodedHeader, encodedPayload, signature] = token.split('.');

  const expectedSignature = createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token has expired');
  }

  return payload;
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
    const payload = verifyJWT(token);

    if (payload.type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Add the admin info to the request for use in the route handler
    req.headers.set('x-admin-username', payload.username);
    req.headers.set('x-admin-email', payload.email);

    return null; // Continue to the route handler
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid or expired token' },
      { status: 401 }
    );
  }
} 