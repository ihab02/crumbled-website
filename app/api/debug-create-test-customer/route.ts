import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { databaseService } from '@/lib/services/databaseService';

export async function POST() {
  try {
    console.log('Creating test customer');
    
    // Check if test customer already exists
    const existingCustomer = await databaseService.query(
      'SELECT id, email FROM customers WHERE email = ?',
      ['test@example.com']
    );
    
    if (existingCustomer.length > 0) {
      console.log('Test customer already exists');
      return NextResponse.json({
        success: true,
        message: 'Test customer already exists',
        customer: existingCustomer[0]
      });
    }
    
    // Hash password
    const passwordHash = await hash('test123', 12);
    
    // Create test customer
    const result = await databaseService.query(
      `INSERT INTO customers (
        email, password, first_name, last_name, phone, 
        type, email_verified
      ) VALUES (?, ?, ?, ?, ?, 'registered', TRUE)`,
      ['test@example.com', passwordHash, 'Test', 'User', '01234567890']
    );
    
    console.log('Test customer created successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Test customer created successfully',
      credentials: {
        email: 'test@example.com',
        password: 'test123'
      }
    });
  } catch (error) {
    console.error('Error creating test customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create test customer' },
      { status: 500 }
    );
  }
} 