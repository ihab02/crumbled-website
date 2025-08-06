import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { paymobService } from '@/lib/services/paymobService';
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 Paymob webhook received:', JSON.stringify(body, null, 2));

    // Handle different webhook types
    const { type, obj } = body;

    if (type === 'TRANSACTION') {
      const {
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
        data
      } = obj;

      // Extract our order ID from the data field
      const ourOrderId = data?.order_id || merchant_order_id;
      
      if (!ourOrderId) {
        console.error('❌ No order ID found in webhook data');
        return NextResponse.json({ success: false, error: 'No order ID found' }, { status: 400 });
      }

      console.log('🔍 Processing transaction webhook:', {
        transactionId,
        paymobOrderId,
        ourOrderId,
        success,
        error_occured,
        is_canceled,
        is_voided
      });

      // Verify the transaction with Paymob (optional but recommended)
      let verifiedTransaction = null;
      try {
        verifiedTransaction = await paymobService.verifyTransaction(transactionId);
        console.log('🔍 Verified transaction:', verifiedTransaction);
      } catch (verifyError) {
        console.error('❌ Failed to verify transaction with Paymob:', verifyError);
        // Continue with webhook data if verification fails
      }

      // Determine order status based on payment result
      let orderStatus = 'pending';
      let paymentStatus = 'pending';

      if (success && !error_occured && !is_canceled && !is_voided && !is_returned) {
        orderStatus = 'confirmed';
        paymentStatus = 'paid';
      } else if (is_canceled || is_voided || is_returned) {
        orderStatus = 'cancelled';
        paymentStatus = 'failed';
      } else if (error_occured) {
        orderStatus = 'failed';
        paymentStatus = 'failed';
      } else if (pending) {
        orderStatus = 'pending';
        paymentStatus = 'pending';
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
      if (paymentStatus === 'failed' || orderStatus === 'cancelled') {
        try {
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
                const flavorMatches = item.flavor_details?.match(/(\w+)\s*\((\d+)x\)/g);
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
        } catch (stockError) {
          console.error('❌ Failed to restore stock:', stockError);
        }
      }

      // Send email notification for successful payments
      if (paymentStatus === 'paid') {
        try {
          // Get order details for email
          const [orderDetailsResult] = await databaseService.query(
            `SELECT o.*, c.first_name, c.last_name, c.email, c.phone 
             FROM orders o 
             JOIN customers c ON o.customer_id = c.id 
             WHERE o.id = ?`,
            [ourOrderId]
          );

          if (Array.isArray(orderDetailsResult) && orderDetailsResult.length > 0) {
            const orderDetails = orderDetailsResult[0] as any;
            
            // Get delivery address
            const [addressResult] = await databaseService.query(
              `SELECT ca.street_address, ca.additional_info, c.name as city_name, z.name as zone_name
               FROM customer_addresses ca
               JOIN cities c ON ca.city_id = c.id
               JOIN zones z ON ca.zone_id = z.id
               WHERE ca.customer_id = ? AND ca.is_default = 1`,
              [orderDetails.customer_id]
            );
            
            const addressData = Array.isArray(addressResult) && addressResult.length > 0 ? addressResult[0] : null;
            
            await EmailService.sendOrderConfirmation(
              orderDetails.email,
              {
                id: ourOrderId,
                customer_name: `${orderDetails.first_name} ${orderDetails.last_name}`,
                customer_email: orderDetails.email,
                customer_phone: orderDetails.phone,
                subtotal: orderDetails.subtotal,
                delivery_fee: orderDetails.delivery_fee,
                total: orderDetails.total_amount,
                status: 'confirmed',
                payment_method: 'paymob',
                delivery_address: addressData?.street_address || '',
                delivery_city: addressData?.city_name || '',
                delivery_zone: addressData?.zone_name || '',
                delivery_time: orderDetails.delivery_time || '',
                delivery_slot: orderDetails.delivery_slot || '',
                expected_delivery_date: orderDetails.expected_delivery_date,
                items: [] // Will be populated by EmailService
              }
            );
            
            console.log('✅ Order confirmation email sent for successful Paymob payment');
          }
        } catch (emailError) {
          console.error('❌ Failed to send order confirmation email:', emailError);
          // Don't fail the webhook if email fails
        }
      }
    } else if (type === 'ORDER') {
      // Handle order-related webhooks if needed
      console.log('🔔 Order webhook received:', obj);
    } else {
      console.log('🔔 Unknown webhook type:', type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Paymob webhook error:', error);
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
} 