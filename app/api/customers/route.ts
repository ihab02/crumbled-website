import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface Customer extends RowDataPacket {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, phone, password, address, cityId, zoneId } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !address || !cityId || !zoneId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existingCustomer] = await db.query<Customer[]>(
      'SELECT id FROM customers WHERE email = ?',
      [email]
    );

    if (existingCustomer.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Start a transaction
    await db.query('START TRANSACTION');

    try {
      // Insert new customer
      const [result] = await db.query<ResultSetHeader>(
        'INSERT INTO customers (first_name, last_name, email, phone, password, mobile_verified, email_verified, type) VALUES (?, ?, ?, ?, ?, true, true, "registered")',
        [firstName, lastName, email, phone, password]
      );

      const customerId = result.insertId;

      // Add address
      await db.query(
        'INSERT INTO addresses (customer_id, city_id, zone_id, street_address, is_default) VALUES (?, ?, ?, ?, true)',
        [customerId, cityId, zoneId, address]
      );

      // Generate JWT token
      const token = sign(
        { 
          id: customerId,
          email,
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

      // Add phone to verified phones in session
      const cookieStore = cookies();
      const verifiedPhones = cookieStore.get('verified_phones');
      const phones = verifiedPhones ? JSON.parse(verifiedPhones.value) : [];
      phones.push(phone);
      cookieStore.set('verified_phones', JSON.stringify(phones), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });

      // Commit the transaction
      await db.query('COMMIT');

      return NextResponse.json({
        message: 'Registration successful',
        customer: {
          id: customerId,
          email,
          firstName,
          lastName,
          phone
        }
      });
    } catch (error) {
      // Rollback the transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get customer profile
    const [customers] = await db.query(
      `SELECT 
        c.id, c.first_name, c.last_name, c.email, c.phone,
        a.id as address_id, a.street_address, a.additional_info, a.is_default,
        ci.name as city_name, z.name as zone_name, z.delivery_fee
      FROM customers c
      LEFT JOIN addresses a ON c.id = a.customer_id
      LEFT JOIN cities ci ON a.city_id = ci.id
      LEFT JOIN zones z ON a.zone_id = z.id
      WHERE c.id = ?`,
      [(token as any).id]
    );

    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customers[0];

    return NextResponse.json({
      customer: {
        id: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        addresses: customers.map(addr => ({
          id: addr.address_id,
          streetAddress: addr.street_address,
          additionalInfo: addr.additional_info,
          isDefault: addr.is_default,
          city: addr.city_name,
          zone: addr.zone_name,
          deliveryFee: addr.delivery_fee
        }))
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { firstName, lastName, phone } = await request.json();

    // Update customer profile
    await db.query(
      'UPDATE customers SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
      [firstName, lastName, phone, (token as any).id]
    );

    return NextResponse.json({
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 