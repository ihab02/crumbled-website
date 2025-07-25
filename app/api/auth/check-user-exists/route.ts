import { NextResponse } from 'next/server';
import databaseService from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists and get email verification status
    const [users] = await databaseService.query<any[]>(
      'SELECT id, email_verified FROM customers WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // User doesn't exist - return generic response for security
      return NextResponse.json({ 
        exists: false, 
        emailVerified: false 
      });
    }

    const user = users[0];
    return NextResponse.json({ 
      exists: true, 
      emailVerified: user.email_verified === 1 || user.email_verified === true 
    });

  } catch (error) {
    console.error('Error checking user exists:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 