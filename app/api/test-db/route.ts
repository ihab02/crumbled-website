import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    // Test basic database connection
    const testResult = await databaseService.testConnection();
    
    if (!testResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testResult.error
      }, { status: 500 });
    }

    // Test a simple query
    const customersResult = await databaseService.query('SELECT COUNT(*) as count FROM customers');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      connectionTest: testResult.data,
      customersCount: customersResult[0]?.count || 0
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 