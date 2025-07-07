import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
    const [existingCustomer] = await pool.query(
      'SELECT id FROM customers WHERE email = ?',
      [email]
    );

    if (Array.isArray(existingCustomer) && existingCustomer.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Start a transaction
    await pool.query('START TRANSACTION');

    try {
      // Insert new customer
      const [result] = await pool.query(
        'INSERT INTO customers (first_name, last_name, email, phone, password, mobile_verified, email_verified, type) VALUES (?, ?, ?, ?, ?, true, true, "registered")',
        [firstName, lastName, email, phone, password]
      );

      const customerId = (result as any).insertId;

      // Add address
      await pool.query(
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
      await pool.query('COMMIT');

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
      await pool.query('ROLLBACK');
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get customer profile
    const customerResult = await databaseService.query(
      `SELECT 
        c.id, c.first_name, c.last_name, c.email, c.phone
      FROM customers c
      WHERE c.email = ?`,
      [session.user.email]
    );

    const customerArray = Array.isArray(customerResult) ? customerResult : (customerResult ? [customerResult] : []);

    if (customerArray.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customerArray[0];

    // Get customer addresses
    const addressesResult = await databaseService.query(
      `SELECT 
        ca.id, ca.street_address, ca.additional_info, ca.is_default,
        c.name as city_name, z.name as zone_name, z.delivery_fee
      FROM customer_addresses ca
      LEFT JOIN cities c ON ca.city_id = c.id
      LEFT JOIN zones z ON ca.zone_id = z.id
      WHERE ca.customer_id = ?`,
      [customer.id]
    );

    const addressesArray = Array.isArray(addressesResult) ? addressesResult : (addressesResult ? [addressesResult] : []);

    return NextResponse.json({
      customer: {
        id: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        addresses: addressesArray.map(addr => ({
          id: addr.id,
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { firstName, lastName, phone } = await request.json();

    // Update customer profile
    await databaseService.query(
      'UPDATE customers SET first_name = ?, last_name = ?, phone = ? WHERE email = ?',
      [firstName, lastName, phone, session.user.email]
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