import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { paymobService } from '@/lib/services/paymobService';

export async function POST(request: NextRequest) {
  try {
    const { transactionId, orderId, success, pending } = await request.json();
    
    console.log('🔍 Verifying payment:', { transactionId, orderId, success, pending });

    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Transaction ID is required'
      }, { status: 400 });
    }

    // Verify transaction with Paymob
    const transaction = await paymobService.verifyTransaction(transactionId);
    console.log('🔍 Paymob transaction:', transaction);

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
    console.log('🔍 Order found:', order);

    // Determine payment status
    let paymentSuccess = false;
    let message = '';

    if (transaction.success && !transaction.error_occured && !transaction.is_canceled) {
      paymentSuccess = true;
      message = 'Payment completed successfully!';
      
      // Update order status
      await databaseService.query(
        'UPDATE orders SET status = ?, payment_status = ?, transaction_id = ? WHERE id = ?',
        ['confirmed', 'paid', transactionId, orderId]
      );
    } else if (transaction.is_canceled || transaction.is_voided) {
      message = 'Payment was cancelled';
      
      // Update order status
      await databaseService.query(
        'UPDATE orders SET status = ?, payment_status = ?, transaction_id = ? WHERE id = ?',
        ['cancelled', 'failed', transactionId, orderId]
      );
      
      // Restore stock
      await databaseService.query(
        `UPDATE products p
         JOIN order_items oi ON p.id = oi.product_id
         SET p.stock_quantity = p.stock_quantity + oi.quantity
         WHERE oi.order_id = ?`,
        [orderId]
      );
    } else if (transaction.error_occured) {
      message = 'Payment failed due to an error';
      
      // Update order status
      await databaseService.query(
        'UPDATE orders SET status = ?, payment_status = ?, transaction_id = ? WHERE id = ?',
        ['failed', 'failed', transactionId, orderId]
      );
      
      // Restore stock
      await databaseService.query(
        `UPDATE products p
         JOIN order_items oi ON p.id = oi.product_id
         SET p.stock_quantity = p.stock_quantity + oi.quantity
         WHERE oi.order_id = ?`,
        [orderId]
      );
    } else {
      message = 'Payment status is pending';
    }

    return NextResponse.json({
      success: true,
      data: {
        success: paymentSuccess,
        message,
        orderId: order.id,
        transactionId,
        amount: order.total_amount
      }
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Payment verification failed'
    }, { status: 500 });
  }
} 