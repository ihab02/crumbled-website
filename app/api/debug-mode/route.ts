import { NextResponse } from 'next/server';
import { getDebugMode } from '@/lib/debug-utils';

// GET /api/debug-mode
export async function GET() {
  try {
    const isDebugMode = await getDebugMode();
    
    return NextResponse.json({
      success: true,
      debugMode: isDebugMode
    });
  } catch (error) {
    console.error('Error fetching debug mode:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debug mode', debugMode: false },
      { status: 500 }
    );
  }
} 