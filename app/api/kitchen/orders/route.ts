import { NextRequest, NextResponse } from 'next/server';
import { orderProcessingService } from '@/lib/services/orderProcessingService';
import { kitchenAuth } from '@/lib/middleware/kitchenAuth';

/**
 * GET /api/kitchen/orders
 * Get orders for the current kitchen
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
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const filters: any = {
      kitchenId: authResult.kitchenId
    };
    
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const orders = await orderProcessingService.getKitchenOrders(
      authResult.kitchenId,
      filters,
      limit,
      offset
    );
    
    return NextResponse.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/kitchen/orders/[id]/status
 * Update order status
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate kitchen user
    const authResult = await kitchenAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status, notes } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const updateResult = await orderProcessingService.updateOrderStatus(
      orderId,
      status,
      authResult.kitchenId,
      authResult.userId,
      notes
    );

    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updateResult.order
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
} 