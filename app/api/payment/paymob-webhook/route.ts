import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { paymobService } from '@/lib/services/paymobService';
import { sendOrderConfirmationEmail } from '@/lib/email-service';

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
      let orderStatus = 'pending';
      let paymentStatus = 'pending';

      if (success && !error_occured && !is_canceled && !is_voided) {
        orderStatus = 'confirmed';
        paymentStatus = 'paid';
      } else if (is_canceled || is_voided) {
        orderStatus = 'cancelled';
        paymentStatus = 'failed';
      } else if (error_occured) {
        orderStatus = 'failed';
        paymentStatus = 'failed';
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
      if (paymentStatus === 'failed') {
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
            
            // Fetch delivery rules for the zone (if available)
            let deliveryRules = null;
            try {
              // Get delivery address from order (if available)
              const [addressResult] = await databaseService.query(
                `SELECT ca.street_address, ca.additional_info, c.name as city_name, z.name as zone_name, z.delivery_fee
                 FROM customer_addresses ca
                 JOIN cities c ON ca.city_id = c.id
                 JOIN zones z ON ca.zone_id = z.id
                 WHERE ca.customer_id = ? AND ca.is_default = 1`,
                [orderDetails.customer_id]
              );
              
              if (Array.isArray(addressResult) && addressResult.length > 0) {
                const address = addressResult[0];
                const currentDate = new Date().toISOString().split('T')[0];
                const deliveryRulesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/zones/delivery-rules?zoneId=${address.zone_id}&orderDate=${currentDate}`);
                if (deliveryRulesResponse.ok) {
                  const deliveryRulesData = await deliveryRulesResponse.json();
                  if (deliveryRulesData.success) {
                    deliveryRules = deliveryRulesData.deliveryRules;
                  }
                }
              }
            } catch (rulesError) {
              console.error('❌ Failed to fetch delivery rules in webhook:', rulesError);
              // Continue without delivery rules if fetch fails
            }
            
            await sendOrderConfirmationEmail(
              orderDetails.email,
              ourOrderId,
              {
                items: [], // TODO: Get actual order items
                subtotal: orderDetails.total,
                deliveryFee: 0, // TODO: Get actual delivery fee
                total: orderDetails.total,
                status: 'confirmed',
                paymentMethod: 'paymob',
                customerInfo: {
                  name: `${orderDetails.first_name} ${orderDetails.last_name}`,
                  email: orderDetails.email,
                  phone: orderDetails.phone
                },
                deliveryAddress: {}, // TODO: Get actual delivery address
                deliveryRules: deliveryRules
              }
            );
            
            console.log('✅ Order confirmation email sent for successful Paymob payment');
          }
        } catch (emailError) {
          console.error('❌ Failed to send order confirmation email:', emailError);
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