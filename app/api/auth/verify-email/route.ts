import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { RowDataPacket } from 'mysql2';

interface Customer extends RowDataPacket {
  id: number;
  email: string;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existingCustomer] = await databaseService.query<Customer[]>(
      'SELECT id FROM customers WHERE email = ?',
      [email]
    );

    return NextResponse.json({
      exists: existingCustomer.length > 0
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
} 