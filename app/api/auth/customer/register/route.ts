import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import pool from '@/lib/db';
import mysql from 'mysql2/promise';

export async function POST(req: NextRequest) {
  let connection;
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

    connection = await pool.getConnection();

    // Check if user already exists
    const [existingUsers] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT id FROM customers WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create new customer
    const [result] = await connection.query<mysql.ResultSetHeader>(
      `INSERT INTO customers (email, password, first_name, last_name, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, firstName, lastName, phone || null]
    );

    const customerId = result.insertId;

    // Get the created customer
    const [customers] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT id, email, first_name, last_name, phone FROM customers WHERE id = ?',
      [customerId]
    );

    const customer = customers[0];

    return NextResponse.json({
      success: true,
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
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