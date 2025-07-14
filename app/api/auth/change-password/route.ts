import { NextRequest, NextResponse } from 'next/server';
import { hash, compare } from 'bcryptjs';
import pool from '@/lib/db';
import { EmailService } from '@/lib/services/emailService';

export async function POST(req: NextRequest) {
  let connection;
  try {
    const body = await req.json();
    console.log('Change password request body:', body);
    
    const { currentPassword, newPassword, customerId } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!customerId) {
      console.log('Customer ID missing from request');
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    console.log('Processing change password for customer ID:', customerId);

    connection = await pool.getConnection();

    // Get customer current password
    const [customers] = await connection.query(
      'SELECT id, password, first_name, last_name, email FROM customers WHERE id = ? AND type = "registered"',
      [customerId]
    );

    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customers[0] as any;

    // Verify current password
    let isValidPassword = false;
    
    // Check if password is plain text (legacy) and migrate it
    if (customer.password.length < 60) {
      // Plain text password, compare directly
      if (customer.password === currentPassword) {
        isValidPassword = true;
      }
    } else {
      // Already hashed password
      isValidPassword = await compare(currentPassword, customer.password);
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 12);

    // Update customer password
    await connection.query(
      'UPDATE customers SET password = ? WHERE id = ?',
      [hashedPassword, customer.id]
    );

    // Send password changed notification email
    try {
      await EmailService.sendPasswordChanged(
        customer.email,
        `${customer.first_name} ${customer.last_name}`
      );
    } catch (emailError) {
      console.error('Error sending password changed notification:', emailError);
      // Don't fail the change if email notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
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