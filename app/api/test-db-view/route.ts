import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const viewName = searchParams.get('view');
    
    if (!viewName) {
      return NextResponse.json(
        { success: false, error: 'View name is required' },
        { status: 400 }
      );
    }

    // Test if the view/table exists
    try {
      const result = await databaseService.query(`SELECT 1 FROM ${viewName} LIMIT 1`);
      return NextResponse.json({
        success: true,
        view: viewName,
        exists: true,
        result: result
      });
    } catch (error) {
      return NextResponse.json({
        success: true,
        view: viewName,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error testing database view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test database view' },
      { status: 500 }
    );
  }
} 