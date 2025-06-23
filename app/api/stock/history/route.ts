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
    const history = await databaseService.query(
      `SELECT * FROM stock_history 
       WHERE item_id = ? AND item_type = ? 
       ORDER BY changed_at DESC 
       LIMIT 100`,
      [parseInt(itemId), itemType]
    );

    // Process the history to fix change_type based on change_amount
    const processedHistory = Array.isArray(history) ? history.map(record => ({
      ...record,
      change_type: record.change_amount > 0 ? 'addition' : record.change_amount < 0 ? 'Reduction' : 'replacement'
    })) : [];

    return NextResponse.json({
      success: true,
      data: processedHistory
    });

  } catch (error) {
    console.error('Error fetching stock history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock history' },
      { status: 500 }
    );
  }
} 