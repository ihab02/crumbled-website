import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Start a transaction
    await databaseService.transaction(async (connection) => {
      // Update each item's display_order
      for (const item of items) {
        await connection.query(
          'UPDATE products SET display_order = ? WHERE id = ?',
          [item.display_order, item.id]
        );
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder products' },
      { status: 500 }
    );
  }
} 