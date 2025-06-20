import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { generateToken } from '@/lib/middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { hash } from 'bcryptjs';

interface Customer extends RowDataPacket {
  id: number;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await req.json();

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
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
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate name length
    if (firstName.length < 2 || lastName.length < 2) {
      return NextResponse.json(
        { error: 'First name and last name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existingCustomers] = await databaseService.query<Customer[]>(
      'SELECT id FROM customers WHERE email = ?',
      [email]
    );

    if (existingCustomers.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const passwordHash = await hash(password, 12);

    // Insert new customer
    const result = await databaseService.query<ResultSetHeader>(
      `INSERT INTO customers (email, password_hash, first_name, last_name, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, firstName, lastName, phone || null]
    );

    const customerId = result.insertId;

    // Generate JWT token
    const token = generateToken({
      type: 'customer',
      id: customerId,
      email
    });

    return NextResponse.json({
      token,
      user: {
        id: customerId,
        email,
        firstName,
        lastName,
        phone
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Customer registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 