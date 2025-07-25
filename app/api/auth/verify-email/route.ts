import { NextResponse } from 'next/server';
import databaseService from '@/lib/db';
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    console.log('🔍 Email verification attempt with token:', token);
    
    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json({ error: 'Verification token is missing' }, { status: 400 });
    }
    
    // Find the token
    console.log('🔍 Searching for token in database...');
    const [rows] = await databaseService.query<any[]>(
      'SELECT evt.*, c.email FROM email_verification_tokens evt JOIN customers c ON evt.customer_id = c.id WHERE evt.token = ?',
      [token]
    );
    console.log('📋 Found tokens:', rows.length);
    
    if (!rows.length) {
      console.log('❌ Token not found in database');
      return NextResponse.json({ error: 'Invalid or expired verification link.' }, { status: 400 });
    }
    
    const record = rows[0];
    console.log('📋 Token record:', { 
      id: record.id, 
      customer_id: record.customer_id, 
      expires_at: record.expires_at,
      is_used: record.is_used 
    });
    
    // Check if already used
    if (record.is_used === 1 || record.is_used === true) {
      console.log('✅ Token already used - checking if email is verified');
      
      // Check if the customer's email is actually verified
      const [customerRows] = await databaseService.query<any[]>(
        'SELECT email_verified FROM customers WHERE id = ?',
        [record.customer_id]
      );
      
      if (customerRows.length > 0 && (customerRows[0].email_verified === 1 || customerRows[0].email_verified === true)) {
        console.log('✅ Email is already verified - returning success');
        return NextResponse.json({ 
          success: true, 
          message: 'Email already verified successfully.',
          alreadyVerified: true,
          email: record.email 
        });
      } else {
        console.log('❌ Token used but email not verified - this is an error state');
        return NextResponse.json({ error: 'Verification link has already been used.' }, { status: 400 });
      }
    }
    
    // Check expiration
    if (new Date(record.expires_at) < new Date()) {
      console.log('❌ Token expired');
      // Delete expired token
      await databaseService.query('DELETE FROM email_verification_tokens WHERE token = ?', [token]);
      return NextResponse.json({ error: 'Verification link has expired.' }, { status: 400 });
    }
    
    console.log('✅ Token valid, marking email as verified...');
    // Mark token as used and email as verified
    await databaseService.query('UPDATE email_verification_tokens SET is_used = 1, used_at = NOW() WHERE token = ?', [token]);
    await databaseService.query(
      'UPDATE customers SET email_verified = TRUE WHERE id = ?',
      [record.customer_id]
    );
    
    console.log('✅ Email verification successful');
    return NextResponse.json({ 
      success: true, 
      message: 'Email verified successfully.',
      email: record.email 
    });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    return NextResponse.json({ error: 'Failed to verify email.' }, { status: 500 });
  }
} 