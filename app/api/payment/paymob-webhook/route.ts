import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { paymobService } from '@/lib/services/paymobService';
import { emailService } from '@/lib/services/emailService';

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
        // Get order items to determine what stock to restore
        const [orderItemsResult] = await databaseService.query(
          `SELECT oi.product_id, oi.quantity, oi.flavor_details, p.is_pack, p.flavor_size
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [ourOrderId]
        );

        if (Array.isArray(orderItemsResult)) {
          for (const item of orderItemsResult) {
            if (item.is_pack) {
              // For packs, restore flavor stock
              // Parse flavor details to get flavor quantities
              // Format is typically "Flavor1 (2x), Flavor2 (1x)"
              const flavorMatches = item.flavor_details.match(/(\w+)\s*\((\d+)x\)/g);
              if (flavorMatches) {
                const packSize = (item.flavor_size || 'Large').toLowerCase();
                const stockField = `stock_quantity_${packSize}`;
                for (const match of flavorMatches) {
                  const [, flavorName, quantityStr] = match.match(/(\w+)\s*\((\d+)x\)/) || [];
                  if (flavorName && quantityStr) {
                    const quantity = parseInt(quantityStr);
                    await databaseService.query(
                      `UPDATE flavors SET ${stockField} = ${stockField} + ? WHERE name = ?`,
                      [quantity, flavorName]
                    );
                  }
                }
              }
            } else {
              // For individual products, restore product stock
              await databaseService.query(
                'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                [item.quantity, item.product_id]
              );
            }
          }
        }
        console.log(`🔄 Stock restored for order ${ourOrderId}`);
      }

      // Send email notification for successful payments
      if (paymentStatus === 'Paid') {
        try {
          // Get order details for email
          const [orderResult] = await databaseService.query(
            `SELECT o.*, 
                    GROUP_CONCAT(CONCAT(oi.quantity, 'x ', oi.flavor_details) SEPARATOR ', ') as items_summary
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.id = ?
             GROUP BY o.id`,
            [ourOrderId]
          );

          if (Array.isArray(orderResult) && orderResult.length > 0) {
            const order = orderResult[0];
            
            // Send order confirmation email
            await emailService.sendOrderConfirmationEmail(
              order.customer_email,
              ourOrderId.toString(),
              {
                items: [{ 
                  name: 'Order Items', 
                  total: order.total_amount,
                  flavorDetails: order.items_summary || 'Various items'
                }],
                subtotal: order.subtotal,
                deliveryFee: order.delivery_fee,
                total: order.total_amount,
                status: 'Confirmed',
                paymentMethod: 'paymob',
                customerInfo: {
                  name: order.customer_name,
                  email: order.customer_email,
                  phone: order.customer_phone
                },
                deliveryAddress: {
                  street_address: order.delivery_address,
                  city_name: order.delivery_city,
                  zone_name: order.delivery_zone
                }
              }
            );
            console.log(`✉️ Order confirmation email sent for order ${ourOrderId}`);
          }
        } catch (emailError) {
          console.error(`❌ Failed to send order confirmation email for order ${ourOrderId}:`, emailError);
          // Don't fail the webhook if email fails
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Paymob webhook error:', error);
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
} 