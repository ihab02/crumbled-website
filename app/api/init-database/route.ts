import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, checkDatabaseHealth } from '@/lib/init-database';

export async function POST(request: NextRequest) {
  try {
    // Check if database is already initialized
    const healthCheck = await checkDatabaseHealth();
    
    if (healthCheck.healthy) {
      return NextResponse.json({
        success: true,
        message: 'Database is already properly initialized',
        health: healthCheck
      });
    }

    // Initialize database
    const result = await initializeDatabase();
    
    if (result.success) {
      // Verify initialization
      const verification = await checkDatabaseHealth();
      
      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully',
        health: verification
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const healthCheck = await checkDatabaseHealth();
    
    return NextResponse.json({
      success: true,
      health: healthCheck
    });
  } catch (error) {
    console.error('Database health check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 