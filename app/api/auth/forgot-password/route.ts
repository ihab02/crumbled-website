import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import pool from '@/lib/db';
import { EmailService } from '@/lib/services/emailService';

export async function POST(req: NextRequest) {
  let connection;
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    connection = await pool.getConnection();

    // Check if customer exists
    const [customers] = await connection.query(
      'SELECT id, first_name, last_name, email FROM customers WHERE email = ? AND type = "registered"',
      [email]
    );

    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json(
        { error: 'No registered account found with this email address' },
        { status: 404 }
      );
    }

    const customer = customers[0] as any;

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    // Delete any existing reset tokens for this user
    await connection.query(
      'DELETE FROM password_reset_tokens WHERE user_id = ? AND user_type = ?',
      [customer.id.toString(), 'customer']
    );

    // Check if expires_at column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'crumbled_nextDB'}' 
      AND TABLE_NAME = 'password_reset_tokens' 
      AND COLUMN_NAME = 'expires_at'
    `);

    const hasExpiresAt = columns.length > 0;

    // Insert new reset token
    if (hasExpiresAt) {
      await connection.query(
        'INSERT INTO password_reset_tokens (user_id, user_type, token_hash, expires_at) VALUES (?, ?, ?, ?)',
        [customer.id.toString(), 'customer', token, expiresAt]
      );
    } else {
      await connection.query(
        'INSERT INTO password_reset_tokens (user_id, user_type, token_hash) VALUES (?, ?, ?)',
        [customer.id.toString(), 'customer', token]
      );
    }

    // Send password reset email
    try {
      await EmailService.sendPasswordReset(
        email, 
        token, 
        `${customer.first_name} ${customer.last_name}`
      );
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Delete the token if email fails
      await connection.query(
        'DELETE FROM password_reset_tokens WHERE user_id = ? AND user_type = ?',
        [customer.id.toString(), 'customer']
      );
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
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