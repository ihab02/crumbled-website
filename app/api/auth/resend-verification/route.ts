import { NextResponse } from 'next/server';
import databaseService from '@/lib/db';
import { EmailService } from '@/lib/email-service';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    // Find the user
    const [users] = await databaseService.query<any[]>(
      'SELECT id, email_verified, first_name FROM customers WHERE email = ?',
      [email]
    );
    if (!users.length) {
      return NextResponse.json({ error: 'No account found with that email.' }, { status: 404 });
    }
    const user = users[0];
    if (user.email_verified === 1 || user.email_verified === true) {
      return NextResponse.json({ error: 'Email is already verified.' }, { status: 400 });
    }
    // Check for existing, unexpired token
    const [tokens] = await databaseService.query<any[]>(
      'SELECT * FROM email_verification_tokens WHERE email = ? AND expires_at > NOW() AND is_used = 0',
      [email]
    );
    let token;
    if (tokens.length) {
      token = tokens[0].token;
    } else {
      // Generate new token
      token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await databaseService.query(
        'INSERT INTO email_verification_tokens (customer_id, email, token, expires_at, is_used, created_at) VALUES (?, ?, ?, ?, 0, NOW())',
        [user.id, email, token, expiresAt]
      );
    }
    // Send the email
    await EmailService.sendThemedEmailVerification(email, token, user.first_name || 'User');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to resend verification email.' }, { status: 500 });
  }
} 