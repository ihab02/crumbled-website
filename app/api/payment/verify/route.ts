import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { paymobService } from '@/lib/services/paymobService';
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { transactionId, orderId, success, pending } = await request.json();
    
    console.log('🔍 Verifying payment:', { transactionId, orderId, success, pending });

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    // Get order details first
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

    // If we have a transaction ID, verify with Paymob
    let transaction = null;
    if (transactionId) {
      try {
        transaction = await paymobService.verifyTransaction(transactionId);
        console.log('🔍 Paymob transaction:', transaction);
      } catch (verifyError) {
        console.error('❌ Failed to verify transaction with Paymob:', verifyError);
        // Continue with URL parameters if Paymob verification fails
      }
    }

    // Determine payment status based on both URL parameters and Paymob verification
    let paymentSuccess = false;
    let message = '';
    let orderStatus = 'pending';
    let paymentStatus = 'pending';

    // Check if payment was successful
    if (transaction) {
      // Use Paymob verification result
      if (transaction.success && !transaction.error_occured && !transaction.is_canceled && !transaction.is_voided) {
        paymentSuccess = true;
        orderStatus = 'confirmed';
        paymentStatus = 'paid';
        message = 'Payment completed successfully!';
      } else if (transaction.is_canceled || transaction.is_voided) {
        orderStatus = 'cancelled';
        paymentStatus = 'failed';
        message = 'Payment was cancelled';
      } else if (transaction.error_occured) {
        orderStatus = 'failed';
        paymentStatus = 'failed';
        message = 'Payment failed due to an error';
      } else if (transaction.pending) {
        orderStatus = 'pending';
        paymentStatus = 'pending';
        message = 'Payment is pending';
      }
    } else {
      // Fall back to URL parameters
      if (success === true && !pending) {
        paymentSuccess = true;
        orderStatus = 'confirmed';
        paymentStatus = 'paid';
        message = 'Payment completed successfully!';
      } else if (success === false) {
        orderStatus = 'failed';
        paymentStatus = 'failed';
        message = 'Payment failed';
      } else if (pending) {
        orderStatus = 'pending';
        paymentStatus = 'pending';
        message = 'Payment is pending';
      }
    }

    // Update order status
    await databaseService.query(
      `UPDATE orders 
       SET status = ?, payment_status = ?, 
           transaction_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [orderStatus, paymentStatus, transactionId || null, orderId]
    );

    console.log(`✅ Order ${orderId} updated: ${orderStatus} / ${paymentStatus}`);

    // Handle failed payments - restore stock
    if (paymentStatus === 'failed' || orderStatus === 'cancelled') {
      try {
        // Get order items to determine what stock to restore
        const [orderItemsResult] = await databaseService.query(
          `SELECT oi.product_id, oi.quantity, oi.flavor_details, p.is_pack, p.flavor_size
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [orderId]
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
        console.log(`🔄 Stock restored for order ${orderId}`);
      } catch (stockError) {
        console.error('❌ Failed to restore stock:', stockError);
      }
    }

    // Send email notification for successful payments
    if (paymentStatus === 'paid') {
      try {
        // Get customer details
        const [customerResult] = await databaseService.query(
          `SELECT c.first_name, c.last_name, c.email, c.phone 
           FROM customers c 
           WHERE c.id = ?`,
          [order.customer_id]
        );

        if (Array.isArray(customerResult) && customerResult.length > 0) {
          const customer = customerResult[0];
          
          // Get delivery address
          const [addressResult] = await databaseService.query(
            `SELECT ca.street_address, ca.additional_info, c.name as city_name, z.name as zone_name
             FROM customer_addresses ca
             JOIN cities c ON ca.city_id = c.id
             JOIN zones z ON ca.zone_id = z.id
             WHERE ca.customer_id = ? AND ca.is_default = 1`,
            [order.customer_id]
          );
          
          const addressData = Array.isArray(addressResult) && addressResult.length > 0 ? addressResult[0] : null;
          
          await EmailService.sendOrderConfirmation(
            customer.email,
            {
              id: orderId,
              customer_name: `${customer.first_name} ${customer.last_name}`,
              customer_email: customer.email,
              customer_phone: customer.phone,
              subtotal: order.subtotal,
              delivery_fee: order.delivery_fee,
              total: order.total_amount,
              status: 'confirmed',
              payment_method: 'paymob',
              delivery_address: addressData?.street_address || '',
              delivery_city: addressData?.city_name || '',
              delivery_zone: addressData?.zone_name || '',
              delivery_time: order.delivery_time || '',
              delivery_slot: order.delivery_slot || '',
              expected_delivery_date: order.expected_delivery_date,
              items: [] // Will be populated by EmailService
            }
          );
          
          console.log('✅ Order confirmation email sent for successful payment');
        }
      } catch (emailError) {
        console.error('❌ Failed to send order confirmation email:', emailError);
        // Don't fail the verification if email fails
      }
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