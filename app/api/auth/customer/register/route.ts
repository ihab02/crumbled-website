import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import pool from '@/lib/db';
import { EmailService } from '@/lib/services/emailService';

// Helper function to calculate age group from birth date
function calculateAgeGroup(birthDate: string): string {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < 13) return '13-17';
  if (age < 18) return '13-17';
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 65) return '55-64';
  return '65+';
}

export async function POST(req: NextRequest) {
  let connection;
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      ageGroup, 
      birthDate,
      cityId,
      zoneId,
      address,
      additionalInfo
    } = await req.json();

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

    // Validate age group if provided
    const validAgeGroups = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    if (ageGroup && !validAgeGroups.includes(ageGroup)) {
      return NextResponse.json(
        { error: 'Invalid age group' },
        { status: 400 }
      );
    }

    // Calculate age group from birth date if provided
    let finalAgeGroup = ageGroup;
    if (birthDate && !ageGroup) {
      finalAgeGroup = calculateAgeGroup(birthDate);
    }

    connection = await pool.getConnection();

    // Check if user already exists
    const [existingUsers] = await connection.query(
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

    // Start transaction
    await connection.query('START TRANSACTION');

    try {
      // Create new customer
      const [result] = await connection.query(
        `INSERT INTO customers (
          email, password, first_name, last_name, phone, 
          age_group, birth_date, type, email_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'registered', FALSE)`,
        [email, passwordHash, firstName, lastName, phone, finalAgeGroup, birthDate || null]
      );

      const customerId = result.insertId;

                        // Add address if provided
                  if (cityId && zoneId && address) {
                    await connection.query(
                      'INSERT INTO customer_addresses (customer_id, city_id, zone_id, street_address, additional_info, is_default) VALUES (?, ?, ?, ?, ?, TRUE)',
                      [customerId, cityId, zoneId, address, additionalInfo || null]
                    );
                  }

      // Generate email verification token
      const verificationToken = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration

      // Insert verification token
      await connection.query(
        'INSERT INTO email_verification_tokens (customer_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
        [customerId, email, verificationToken, expiresAt]
      );

      // Send verification email
      try {
        await EmailService.sendEmailVerification(
          email, 
          verificationToken, 
          `${firstName} ${lastName}`
        );
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // Don't fail registration if email fails, but log it
      }

      // Commit transaction
      await connection.query('COMMIT');

      // Get the created customer
      const [customers] = await connection.query(
        'SELECT id, email, first_name, last_name, phone, age_group, email_verified FROM customers WHERE id = ?',
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
          phone: customer.phone,
          ageGroup: customer.age_group,
          emailVerified: customer.email_verified
        },
        message: 'Account created successfully. Please check your email to verify your account.'
      });

    } catch (error) {
      // Rollback transaction on error
      await connection.query('ROLLBACK');
      throw error;
    }

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