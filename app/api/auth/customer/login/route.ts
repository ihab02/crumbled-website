import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { generateToken } from '@/lib/middleware/auth';
import { RowDataPacket } from 'mysql2';

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

    // Plain text password comparison (NOT recommended for production)
    if (customer.password_hash !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      type: 'customer',
      userId: customer.id.toString(),
      email: customer.email
    });

    return NextResponse.json({
      token,
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