import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { RowDataPacket } from 'mysql2';
import { compare, hash } from 'bcryptjs';
import { getJwtSecret } from '@/lib/auth-config';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60; // 15 minutes in seconds

interface AdminUser extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password: string;
  login_attempts?: number;
  locked_until?: Date;
}

// Sign JWT using Web Crypto API
async function signJWT(payload: any): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (7 * 24 * 60 * 60); // 7 days

  const finalPayload = {
    ...payload,
    iat: now,
    exp
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(finalPayload));
  const data = encoder.encode(`${headerB64}.${payloadB64}`);

  // Import the secret key using the same function as verification
  const JWT_SECRET = getJwtSecret('admin');
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the data
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Query the database for the admin user
    const result = await databaseService.query(
      'SELECT * FROM admin_users WHERE username = ?',
      [username]
    );

    const admin = Array.isArray(result) ? result[0] : result;

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Account is temporarily locked. Please try again later.',
          lockedUntil: admin.locked_until
        },
        { status: 429 }
      );
    }

    // Verify password
    const isValidPassword = await compare(password, admin.password);
    
    if (!isValidPassword) {
      // Increment login attempts
      const attempts = (admin.login_attempts || 0) + 1;
      const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS 
        ? new Date(Date.now() + LOCKOUT_DURATION * 1000)
        : null;

      await databaseService.query(
        'UPDATE admin_users SET login_attempts = ?, locked_until = ? WHERE id = ?',
        [attempts, lockedUntil, admin.id]
      );

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Too many failed attempts. Account is temporarily locked.',
            lockedUntil
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid username or password',
          remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts
        },
        { status: 401 }
      );
    }

    // Reset login attempts on successful login
    await databaseService.query(
      'UPDATE admin_users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
      [admin.id]
    );

    // Generate JWT token
    const token = await signJWT({
      id: admin.id,
      username: admin.username,
      role: 'admin'
    });

    // Create the response with the cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        username: admin.username
      }
    });

    // Set the cookie with domain and path settings
    const cookieOptions = {
      name: 'adminToken',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    };

    console.log('Setting admin cookie with options:', cookieOptions);
    response.cookies.set(cookieOptions);
    console.log('Cookie set in response:', response.cookies.get('adminToken'));

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 