import { NextResponse } from 'next/server';
import databaseService from '@/lib/db';
import { compare } from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check if user exists
    const [users] = await databaseService.query<any[]>(
      'SELECT id, email, password, email_verified FROM customers WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // User doesn't exist - return generic response for security
      return NextResponse.json({ 
        credentialsValid: false, 
        emailVerified: false 
      });
    }

    const user = users[0];

    // Check if password is correct
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      // Wrong password - return generic response for security
      return NextResponse.json({ 
        credentialsValid: false, 
        emailVerified: false 
      });
    }

    // Credentials are valid, check email verification status
    const emailVerified = user.email_verified === 1 || user.email_verified === true;

    return NextResponse.json({ 
      credentialsValid: true, 
      emailVerified: emailVerified 
    });

  } catch (error) {
    console.error('Error checking credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 