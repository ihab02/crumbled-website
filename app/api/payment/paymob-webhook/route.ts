import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { paymobService } from '@/lib/services/paymobService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 Paymob webhook received:', body);

    const {
      type,
      obj: {
        id: transactionId,
        order: { id: paymobOrderId },
        success,
        amount_cents,
        currency,
        payment_method,
        pending,
        is_refunded,
        is_void,
        is_voided,
        is_captured,
        is_standalone_payment,
        error_occured,
        is_canceled,
        is_returned,
        is_deleted,
        is_auto_reversed,
        is_reversed,
        merchant_order_id,
        wallet_notification,
        processed,
        created_at,
        updated_at,
        data: { order_id: ourOrderId }
      }
    } = body;

    // Verify the transaction with Paymob
    const transaction = await paymobService.verifyTransaction(transactionId);
    console.log('🔍 Verified transaction:', transaction);

    if (type === 'TRANSACTION') {
      // Update order status based on payment result
      let orderStatus = 'Pending';
      let paymentStatus = 'Pending';

      if (success && !error_occured && !is_canceled && !is_voided) {
        orderStatus = 'Confirmed';
        paymentStatus = 'Paid';
      } else if (is_canceled || is_voided) {
        orderStatus = 'Cancelled';
        paymentStatus = 'Failed';
      } else if (error_occured) {
        orderStatus = 'Failed';
        paymentStatus = 'Failed';
      }

      // Update order in database
      await databaseService.query(
        `UPDATE orders 
         SET status = ?, payment_status = ?, 
             paymob_transaction_id = ?, paymob_order_id = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [orderStatus, paymentStatus, transactionId, paymobOrderId, ourOrderId]
      );

      console.log(`✅ Order ${ourOrderId} updated: ${orderStatus} / ${paymentStatus}`);

      // If payment failed, restore stock
      if (paymentStatus === 'Failed') {
        await databaseService.query(
          `UPDATE products p
           JOIN order_items oi ON p.id = oi.product_id
           SET p.stock_quantity = p.stock_quantity + oi.quantity
           WHERE oi.order_id = ?`,
          [ourOrderId]
        );
        console.log(`🔄 Stock restored for order ${ourOrderId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Paymob webhook error:', error);
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
} 