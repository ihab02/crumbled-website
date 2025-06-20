import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { generateToken, generateRefreshToken, generateSessionId } from '@/lib/middleware/auth';
import { sessionManager } from '@/lib/session-manager';
import { validatePassword } from '@/lib/auth-config';
import { RowDataPacket } from 'mysql2';
import { compare, hash } from 'bcryptjs';

interface Customer extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

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

    // Get customer from database
    const [customers] = await databaseService.query<Customer[]>(
      'SELECT id, email, password_hash, first_name, last_name, phone FROM customers WHERE email = ?',
      [email]
    );

    if (customers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const customer = customers[0];

    // Check if password_hash is plain text (legacy) and migrate it
    let isValidPassword = false;
    
    if (customer.password_hash.length < 60) {
      // Legacy plain text password - compare directly and migrate
      if (customer.password_hash === password) {
        // Hash the password and update the database
        const hashedPassword = await hash(password, 12);
        await databaseService.query(
          'UPDATE customers SET password_hash = ? WHERE id = ?',
          [hashedPassword, customer.id]
        );
        isValidPassword = true;
      }
    } else {
      // Modern bcrypt hash - compare properly
      isValidPassword = await compare(password, customer.password_hash);
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
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
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    await sessionManager.createSession(
      customer.id.toString(),
      'customer',
      sessionId,
      refreshToken,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
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
  } catch (error) {
    console.error('Customer login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 