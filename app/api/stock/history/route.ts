import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');
    const itemType = searchParams.get('item_type');

    if (!itemId || !itemType) {
      return NextResponse.json(
        { success: false, error: 'Item ID and type are required' },
        { status: 400 }
      );
    }

    // Validate item type
    if (!['flavor', 'product'].includes(itemType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid item type' },
        { status: 400 }
      );
    }

    // Fetch stock history for the item
    const [history] = await databaseService.query(
      `SELECT * FROM stock_history 
       WHERE item_id = ? AND item_type = ? 
       ORDER BY changed_at DESC 
       LIMIT 100`,
      [itemId, itemType]
    );

    return NextResponse.json({
      success: true,
      data: history || []
    });

  } catch (error) {
    console.error('Error fetching stock history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock history' },
      { status: 500 }
    );
  }
} 