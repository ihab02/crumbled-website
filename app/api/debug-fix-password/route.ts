import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { databaseService } from '@/lib/services/databaseService';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();
    
    if (!email || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Email and new password are required'
      }, { status: 400 });
    }

    console.log('Fixing password for email:', email);
    
    // Check if user exists
    const existingUser = await databaseService.query(
      'SELECT id, email FROM customers WHERE email = ?',
      [email]
    );
    
    if (existingUser.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    // Hash the new password with bcrypt (12 salt rounds)
    const passwordHash = await hash(newPassword, 12);
    
    // Update the password
    await databaseService.query(
      'UPDATE customers SET password = ? WHERE email = ?',
      [passwordHash, email]
    );
    
    console.log('Password updated successfully for:', email);
    
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      credentials: {
        email: email,
        password: newPassword
      }
    });
    
  } catch (error) {
    console.error('Error fixing password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update password' },
      { status: 500 }
    );
  }
} 