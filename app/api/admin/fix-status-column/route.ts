import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { verifyJWT } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fix the status column size
    await databaseService.query(`
      ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'
    `);

    return NextResponse.json({
      success: true,
      message: 'Status column fixed successfully'
    });

  } catch (error) {
    console.error('Error fixing status column:', error);
    return NextResponse.json(
      { error: 'Failed to fix status column' },
      { status: 500 }
    );
  }
} 