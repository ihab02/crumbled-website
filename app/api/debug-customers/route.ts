import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    console.log('Debug customers API called');
    
    // Get all customers
    const customers = await databaseService.query(
      'SELECT id, email, first_name, last_name, phone, created_at FROM customers ORDER BY created_at DESC LIMIT 10'
    );
    
    console.log('Customers found:', customers.length);
    console.log('Sample customers:', customers.slice(0, 3));
    
    return NextResponse.json({
      success: true,
      count: customers.length,
      customers: customers
    });
  } catch (error) {
    console.error('Debug customers error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
} 