import { NextRequest, NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';
import pool from '@/lib/db';
import mysql from 'mysql2/promise';
import { generateToken, generateRefreshToken, generateSessionId } from '@/lib/middleware/auth';
import { sessionManager } from '@/lib/session-manager';
import { validatePassword } from '@/lib/auth-config';
import { RowDataPacket } from 'mysql2';

interface Customer {
  id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password requirements not met', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Get customer from database
    const [customers] = await connection.query(
      'SELECT id, email, password, first_name, last_name, phone, email_verified FROM customers WHERE email = ?',
      [email]
    );

    if (!customers || customers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const customer = customers[0] as Customer & { email_verified?: number | boolean };
    let isValidPassword = false;

    // Check if password is plain text (legacy) and migrate it
    if (customer.password.length < 60) {
      // Plain text password, compare directly
      if (customer.password === password) {
        isValidPassword = true;
        // Hash the password for future use
        const hashedPassword = await hash(password, 12);
        await connection.query(
          'UPDATE customers SET password = ? WHERE id = ?',
          [hashedPassword, customer.id]
        );
      }
    } else {
      // Already hashed password
      isValidPassword = await compare(password, customer.password);
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    // Check if email is verified (handle boolean or numeric)
    if (customer.email_verified === 0 || customer.email_verified === false) {
      return NextResponse.json(
        { error: 'Your email address is not verified. Please check your inbox and click the verification link before logging in.' },
        { status: 403 }
      );
    }

    // Generate session ID
    const sessionId = generateSessionId();

    // Generate access token
    const accessToken = generateToken({
      type: 'customer',
      id: customer.id,
      email: customer.email,
      sessionId
    });

    // Generate refresh token
    const refreshToken = generateRefreshToken(customer.id.toString(), 'customer', sessionId);

    // Create session
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    await sessionManager.createSession(
      customer.id.toString(),
      'customer',
      sessionId,
      refreshToken,
      ipAddress,
      userAgent
    );

    // Set session cookie
    const response = NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone
      }
    });

    response.cookies.set('user_session', JSON.stringify({
      id: customer.id,
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 