import { NextRequest, NextResponse } from 'next/server';
import { batchPreparationService } from '@/lib/services/batchPreparationService';
import { kitchenAuth } from '@/lib/middleware/kitchenAuth';

/**
 * GET /api/kitchen/batches
 * Get batches for the current kitchen
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate kitchen user
    const authResult = await kitchenAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const filters: any = {
      kitchenId: authResult.user.selectedKitchen.id
    };
    
    if (status) filters.status = status;
    if (date) filters.date = date;

    const batches = await batchPreparationService.getKitchenBatches(
      authResult.user.selectedKitchen.id,
      filters
    );
    
    return NextResponse.json({
      success: true,
      data: batches
    });

  } catch (error) {
    console.error('Error fetching kitchen batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/kitchen/batches
 * Create a new batch
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate kitchen user
    const authResult = await kitchenAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      plannedStartTime,
      plannedEndTime,
      items,
      priority = 'normal'
    } = body;

    // Validate required fields
    if (!name || !plannedStartTime || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Name, start time, and items are required' },
        { status: 400 }
      );
    }

    const batchData = {
      name,
      kitchen_id: authResult.user.selectedKitchen.id,
      order_ids: items, // assuming items is an array of order IDs
      priority,
      notes: description,
      created_by: authResult.user.id
    };

    const batch = await batchPreparationService.createBatch(batchData);
    
    return NextResponse.json({
      success: true,
      data: batch
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
} 