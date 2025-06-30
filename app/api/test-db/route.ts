import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    // Test basic database connection
    const result = await databaseService.query('SELECT NOW() as current_time');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: result
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database connection failed'
    }, { status: 500 });
  }
}
