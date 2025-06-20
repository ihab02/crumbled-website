import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { generateToken } from '@/lib/middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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
    const { email, password, firstName, lastName, phone } = await req.json();

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
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

    // Store password as plain text (NOT recommended for production)
    const passwordHash = password;

    // Insert new customer
    const [[result]] = await databaseService.query<[ResultSetHeader, any]>(
      `INSERT INTO customers (email, password_hash, first_name, last_name, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, firstName, lastName, phone || null]
    );

    const customerId = result.insertId;

    // Generate JWT token
    const token = generateToken({
      type: 'customer',
      userId: customerId.toString(),
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