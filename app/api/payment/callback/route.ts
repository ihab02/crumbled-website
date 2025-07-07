import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const transactionId = searchParams.get('transaction_id');
    const success = searchParams.get('success');
    const pending = searchParams.get('pending');

    console.log('🔍 Payment callback received:', { orderId, transactionId, success, pending });

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    // Get order details
    const orderResult = await databaseService.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (!Array.isArray(orderResult) || orderResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    const order = orderResult[0];

    // Update order with callback information
    await databaseService.query(
      'UPDATE orders SET callback_received = 1, callback_data = ? WHERE id = ?',
      [JSON.stringify({ transactionId, success, pending }), orderId]
    );

    return NextResponse.json({
      success: true,
      message: 'Payment callback processed successfully',
      orderId: order.id
    });

  } catch (error) {
    console.error('❌ Payment callback error:', error);
    return NextResponse.json({
      success: false,
      error: 'Payment callback processing failed'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 Payment callback POST received:', body);

    const { orderId, transactionId, success, pending } = body;

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    // Get order details
    const orderResult = await databaseService.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (!Array.isArray(orderResult) || orderResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    const order = orderResult[0];

    // Update order with callback information
    await databaseService.query(
      'UPDATE orders SET callback_received = 1, callback_data = ? WHERE id = ?',
      [JSON.stringify({ transactionId, success, pending }), orderId]
    );

    return NextResponse.json({
      success: true,
      message: 'Payment callback processed successfully',
      orderId: order.id
    });

  } catch (error) {
    console.error('❌ Payment callback error:', error);
    return NextResponse.json({
      success: false,
      error: 'Payment callback processing failed'
    }, { status: 500 });
  }
} 