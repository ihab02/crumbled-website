import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import pool from '@/lib/db';
import { EmailService } from '@/lib/services/emailService';

export async function POST(req: NextRequest) {
  let connection;
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Check if expires_at column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'crumbled_nextDB'}' 
      AND TABLE_NAME = 'password_reset_tokens' 
      AND COLUMN_NAME = 'expires_at'
    `);

    const hasExpiresAt = columns.length > 0;

    // Find the reset token
    let query: string;
    let params: any[];

    if (hasExpiresAt) {
      query = `SELECT prt.*, c.first_name, c.last_name, c.email 
               FROM password_reset_tokens prt
               JOIN customers c ON CAST(prt.user_id AS UNSIGNED) = c.id
               WHERE prt.token_hash = ? AND prt.user_type = ? AND prt.expires_at > NOW()`;
      params = [token, 'customer'];
    } else {
      query = `SELECT prt.*, c.first_name, c.last_name, c.email 
               FROM password_reset_tokens prt
               JOIN customers c ON CAST(prt.user_id AS UNSIGNED) = c.id
               WHERE prt.token_hash = ? AND prt.user_type = ?`;
      params = [token, 'customer'];
    }

    const [tokens] = await connection.query(query, params);

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { error: hasExpiresAt ? 'Invalid or expired reset token' : 'Invalid reset token' },
        { status: 400 }
      );
    }

    const resetToken = tokens[0] as any;

    // Hash the new password
    const hashedPassword = await hash(newPassword, 12);

    // Update customer password
    await connection.query(
      'UPDATE customers SET password = ? WHERE id = ?',
      [hashedPassword, parseInt(resetToken.user_id)]
    );

    // Delete the used token
    await connection.query(
      'DELETE FROM password_reset_tokens WHERE id = ?',
      [resetToken.id]
    );

    // Send password changed notification email
    try {
      await EmailService.sendPasswordChanged(
        resetToken.email,
        `${resetToken.first_name} ${resetToken.last_name}`
      );
    } catch (emailError) {
      console.error('Error sending password changed notification:', emailError);
      // Don't fail the reset if email notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
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

export async function GET(req: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Check if expires_at column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'crumbled_nextDB'}' 
      AND TABLE_NAME = 'password_reset_tokens' 
      AND COLUMN_NAME = 'expires_at'
    `);

    const hasExpiresAt = columns.length > 0;

    // Check if token is valid
    let query: string;
    let params: any[];

    if (hasExpiresAt) {
      query = `SELECT prt.*, c.first_name, c.last_name, c.email 
               FROM password_reset_tokens prt
               JOIN customers c ON CAST(prt.user_id AS UNSIGNED) = c.id
               WHERE prt.token_hash = ? AND prt.user_type = ? AND prt.expires_at > NOW()`;
      params = [token, 'customer'];
    } else {
      query = `SELECT prt.*, c.first_name, c.last_name, c.email 
               FROM password_reset_tokens prt
               JOIN customers c ON CAST(prt.user_id AS UNSIGNED) = c.id
               WHERE prt.token_hash = ? AND prt.user_type = ?`;
      params = [token, 'customer'];
    }

    const [tokens] = await connection.query(query, params);

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { error: hasExpiresAt ? 'Invalid or expired reset token' : 'Invalid reset token' },
        { status: 400 }
      );
    }

    const resetToken = tokens[0] as any;

    return NextResponse.json({
      success: true,
      valid: true,
      email: resetToken.email,
      customerName: `${resetToken.first_name} ${resetToken.last_name}`
    });

  } catch (error) {
    console.error('Token validation error:', error);
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