import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface Customer {
  id: number;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get customer by email
    const [customers] = await db.query(
      'SELECT id, email, password FROM customers WHERE email = ?',
      [email]
    );

    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const customer = customers[0] as Customer;

    // Plain text password comparison (NOT recommended for production)
    if (password !== customer.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = sign(
      { 
        id: customer.id,
        email: customer.email,
        role: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return NextResponse.json({
      message: 'Login successful',
      customer: {
        id: customer.id,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 