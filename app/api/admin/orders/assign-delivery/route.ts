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

    const { orderIds, deliveryManId } = await request.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs are required' },
        { status: 400 }
      );
    }

    if (!deliveryManId) {
      return NextResponse.json(
        { error: 'Delivery person ID is required' },
        { status: 400 }
      );
    }

    // Verify delivery person exists and is active
    const deliveryMan = await databaseService.query(
      'SELECT id, name FROM delivery_men WHERE id = ? AND is_active = 1',
      [deliveryManId]
    );

    if (!deliveryMan || deliveryMan.length === 0) {
      return NextResponse.json(
        { error: 'Delivery person not found or inactive' },
        { status: 404 }
      );
    }

    // Check if any orders are already delivered or cancelled
    const orderStatuses = await databaseService.query(
      'SELECT id, status FROM orders WHERE id IN (?)',
      [orderIds]
    );

    const deliveredOrders = orderStatuses.filter((order: any) => 
      order.status === 'delivered' || order.status === 'cancelled'
    );

    if (deliveredOrders.length > 0) {
      const orderIdsList = deliveredOrders.map((order: any) => order.id).join(', ');
      return NextResponse.json(
        { 
          error: `Cannot assign delivered or cancelled orders to delivery. Orders: ${orderIdsList}` 
        },
        { status: 400 }
      );
    }

    // Start transaction
    await databaseService.transaction(async (connection) => {
      // Update each order
      for (const orderId of orderIds) {
        // Update order status to "out_for_delivery" and assign delivery person
        try {
          await connection.execute(
            `UPDATE orders 
             SET status = 'out_for_delivery', 
                 delivery_man_id = ?, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [deliveryManId, orderId]
          );
        } catch (error) {
          console.error('Error updating order:', error);
          // If status column is too small, try with a shorter status
          await connection.execute(
            `UPDATE orders 
             SET status = 'delivering', 
                 delivery_man_id = ?, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [deliveryManId, orderId]
          );
        }

        // Log the assignment
        console.log(`Order ${orderId} assigned to delivery person ${deliveryMan[0].name} (ID: ${deliveryManId})`);
      }
    });

    return NextResponse.json({
      success: true,
      message: `${orderIds.length} order(s) assigned to delivery person successfully`,
      deliveryPerson: deliveryMan[0].name
    });

  } catch (error) {
    console.error('Error assigning delivery person to orders:', error);
    return NextResponse.json(
      { error: 'Failed to assign delivery person to orders' },
      { status: 500 }
    );
  }
} 