import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';
import { paymobService } from '@/lib/services/paymobService';
import { emailService } from '@/lib/services/emailService';

interface CheckoutPaymentRequest {
  cartId?: string;
  paymentMethod: 'cod' | 'paymob';
  orderData: {
    cart: {
      items: Array<{
        id: number;
        name: string;
        basePrice: number;
        quantity: number;
        isPack: boolean;
        packSize: string;
        imageUrl: string;
        count: number;
        flavorDetails: string;
        total: number;
        flavors: Array<{
          id: number;
          name: string;
          quantity: number;
          price: number;
          size: string;
        }>;
      }>;
      subtotal: number;
      deliveryFee: number;
      total: number;
      itemCount: number;
    };
    deliveryAddress: {
      street_address: string;
      additional_info?: string;
      city_name: string;
      zone_name: string;
      delivery_fee: number;
    };
    customerInfo: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

interface CheckoutPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    orderId?: number;
    paymentUrl?: string;
    paymentToken?: string;
  };
  error?: string;
}

// Helper function to get or create cart (same as cart API)
async function getOrCreateCart(): Promise<string> {
  const cookieStore = cookies();
  let cartId = cookieStore.get('cart_id')?.value;

  if (!cartId) {
    const sessionId = uuidv4();
    const result = await databaseService.query<{ insertId: number }>(
      'INSERT INTO carts (session_id, status, created_at) VALUES (?, "active", NOW())',
      [sessionId]
    );
    
    cartId = result.insertId.toString();
    setCartCookie(cartId);
    console.log('Created new cart:', cartId);
  } else {
    const cartExists = await databaseService.query(
      'SELECT * FROM carts WHERE id = ? AND status = "active"',
      [cartId]
    );

    if (!Array.isArray(cartExists) || cartExists.length === 0) {
      const sessionId = uuidv4();
      const result = await databaseService.query<{ insertId: number }>(
        'INSERT INTO carts (session_id, status, created_at) VALUES (?, "active", NOW())',
        [sessionId]
      );
      
      cartId = result.insertId.toString();
      setCartCookie(cartId);
      console.log('Created new cart (old one invalid):', cartId);
    }
  }

  return cartId;
}

function setCartCookie(cartId: string) {
  const cookieStore = cookies();
  cookieStore.set('cart_id', cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60
  });
}

// Real Paymob integration
const generatePaymobPayment = async (orderData: any, customerInfo: any, orderId: number) => {
  try {
    console.log('🔍 [DEBUG] generatePaymobPayment - Starting Paymob payment generation')
    console.log('🔍 [DEBUG] generatePaymobPayment - Order Data:', orderData)
    console.log('🔍 [DEBUG] generatePaymobPayment - Customer Info:', customerInfo)
    console.log('🔍 [DEBUG] generatePaymobPayment - Order ID:', orderId)

    // Create Paymob order
    console.log('🔍 [DEBUG] generatePaymobPayment - Creating Paymob order')
    const paymobOrder = await paymobService.createOrder({
      amount: orderData.cart.total,
      items: orderData.cart.items.map((item: any) => ({
        name: item.name,
        amount: item.total,
        description: item.flavorDetails || item.name,
        quantity: item.quantity
      })),
      delivery_needed: true
    });

    console.log('🔍 [DEBUG] generatePaymobPayment - Paymob order created:', paymobOrder.id)

    // Generate payment key
    console.log('🔍 [DEBUG] generatePaymobPayment - Generating payment key')
    const paymentKey = await paymobService.generatePaymentKey({
      orderId: paymobOrder.id,
      amount: orderData.cart.total,
      billingData: {
        first_name: customerInfo.name.split(' ')[0] || customerInfo.name,
        last_name: customerInfo.name.split(' ').slice(1).join(' ') || customerInfo.name,
        email: customerInfo.email,
        phone_number: customerInfo.phone,
        street: orderData.deliveryAddress.street_address,
        city: orderData.deliveryAddress.city_name,
        country: 'Egypt',
        apartment: orderData.deliveryAddress.additional_info || 'NA',
        building: 'NA',
        floor: 'NA',
        postal_code: 'NA',
        state: 'NA'
      }
    });

    console.log('🔍 [DEBUG] generatePaymobPayment - Payment key generated:', paymentKey.token)

    // Get payment URL with order ID in the URL parameters
    const paymentUrl = `${paymobService.getPaymentUrl(paymentKey.token)}&order_id=${orderId}`;
    console.log('🔍 [DEBUG] generatePaymobPayment - Payment URL generated:', paymentUrl)

    return {
      paymentToken: paymentKey.token,
      paymentUrl,
      paymobOrderId: paymobOrder.id
    };
  } catch (error) {
    console.error('❌ [DEBUG] generatePaymobPayment - Error:', error);
    throw new Error('Failed to generate Paymob payment');
  }
};

export async function POST(request: NextRequest): Promise<NextResponse<CheckoutPaymentResponse>> {
  try {
    console.log('🔍 [DEBUG] Payment API called')
    const session = await getServerSession(authOptions);
    const { paymentMethod, orderData } = await request.json() as CheckoutPaymentRequest;
    const cartId = await getOrCreateCart();

    console.log('🔍 [DEBUG] Payment API - Session:', session?.user?.email)
    console.log('🔍 [DEBUG] Payment API - Payment Method:', paymentMethod)
    console.log('🔍 [DEBUG] Payment API - Cart ID:', cartId)
    console.log('🔍 [DEBUG] Payment API - Order Data:', orderData)
    console.log('🔍 [DEBUG] Payment API - Cart items structure:', JSON.stringify(orderData.cart.items, null, 2))

    // Validate request
    if (!cartId || !paymentMethod || !orderData) {
      console.error('❌ [DEBUG] Payment API - Missing required fields')
      return NextResponse.json({
        success: false,
        message: 'Missing required fields',
        error: 'Cart not found, payment method, and order data are required'
      }, { status: 400 });
    }

    // Validate payment method
    if (!['cod', 'paymob'].includes(paymentMethod)) {
      console.error('❌ [DEBUG] Payment API - Invalid payment method:', paymentMethod)
      return NextResponse.json({
        success: false,
        message: 'Invalid payment method',
        error: 'Payment method must be either "cod" or "paymob"'
      }, { status: 400 });
    }

    console.log('🔍 [DEBUG] Payment API - Starting database transaction')

    // Start database transaction
    const result = await databaseService.transaction(async (connection) => {
      // Create order
      const orderStatus = 'pending'; // Use 'pending' for both COD and Paymob initially
      const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'pending';

      let customerId = null;
      
      if (session?.user) {
        // Authenticated user - find in customers table
        console.log('🔍 [DEBUG] Payment API - Processing authenticated user')
        console.log('🔍 [DEBUG] Payment API - User email:', session.user.email)
        
        // Find customer in customers table
        const [customerRows] = await connection.query('SELECT id FROM customers WHERE email = ?', [session.user.email]);
        console.log('🔍 [DEBUG] Payment API - Customer lookup result:', customerRows)
        
        if (Array.isArray(customerRows) && customerRows.length > 0) {
          customerId = (customerRows[0] as any).id;
          console.log('🔍 [DEBUG] Payment API - Found existing customer with ID:', customerId)
        } else {
          console.error('❌ [DEBUG] Payment API - Customer not found in customers table')
          throw new Error('Customer not found in database');
        }
      } else {
        // Guest user - create customer record from guest data
        console.log('🔍 [DEBUG] Payment API - Processing guest user')
        
        if (!orderData.customerInfo) {
          throw new Error('Customer information is required for guest checkout');
        }
        
        console.log('🔍 [DEBUG] Payment API - Guest customer info:', orderData.customerInfo)
        
        // Check if guest customer already exists
        console.log(`🔍 [DEBUG] Payment API - Checking for existing customer with email: ${orderData.customerInfo.email}`)
        const [existingCustomerRows] = await connection.query(
          'SELECT id, type FROM customers WHERE email = ?',
          [orderData.customerInfo.email]
        );
        
        console.log(`🔍 [DEBUG] Payment API - Existing customer query result:`, existingCustomerRows)
        console.log(`🔍 [DEBUG] Payment API - Existing customer rows type:`, typeof existingCustomerRows)
        console.log(`🔍 [DEBUG] Payment API - Existing customer rows is array:`, Array.isArray(existingCustomerRows))
        console.log(`🔍 [DEBUG] Payment API - Existing customer rows length:`, Array.isArray(existingCustomerRows) ? existingCustomerRows.length : 'Not an array')
        
        if (Array.isArray(existingCustomerRows) && existingCustomerRows.length > 0) {
          // Use existing customer (regardless of type)
          customerId = (existingCustomerRows[0] as any).id;
          console.log('🔍 [DEBUG] Payment API - Found existing customer with ID:', customerId, 'Type:', (existingCustomerRows[0] as any).type)
        } else {
          console.log('🔍 [DEBUG] Payment API - No existing customer found, creating new one')
          // Create new guest customer record in customers table
          const [insertResult] = await connection.query(
            'INSERT INTO customers (first_name, last_name, email, phone, type, password) VALUES (?, ?, ?, ?, ?, ?)',
            [
              orderData.customerInfo.name.split(' ')[0] || orderData.customerInfo.name, // first_name
              orderData.customerInfo.name.split(' ').slice(1).join(' ') || '', // last_name
              orderData.customerInfo.email, 
              orderData.customerInfo.phone, 
              'guest',
              '' // Empty password for guest users
            ]
          );
          
          customerId = (insertResult as any).insertId;
          console.log('🔍 [DEBUG] Payment API - Created new guest customer record in customers table with ID:', customerId)
        }
      }
      
      if (!customerId) {
        console.error('❌ [DEBUG] Payment API - No customer ID obtained, throwing error')
        throw new Error('Failed to create or find customer record');
      }
      
      console.log('🔍 [DEBUG] Payment API - Final customer ID:', customerId)

      const [orderResult] = await connection.query(
        `INSERT INTO orders (
          customer_id, 
          total, 
          status, 
          payment_method,
          created_at
        ) VALUES (?, ?, ?, ?, NOW())`,
        [
          customerId,
          Number(orderData.cart.total),
          orderStatus,
          paymentMethod === 'cod' ? 'cash' : 'card'
        ]
      );

      const orderId = (orderResult as any).insertId;
      console.log(`🔍 [DEBUG] Payment API - Order created with ID: ${orderId}`)

      // Create order items for each cart item
      console.log(`🔍 [DEBUG] Payment API - About to start order items creation`)
      console.log(`🔍 [DEBUG] Payment API - Starting order items creation for ${orderData.cart.items.length} items`)
      for (const item of orderData.cart.items) {
        try {
          console.log(`🔍 [DEBUG] Payment API - Processing item:`, item)
          
          // First, create or find product_instance
          let productInstanceId;
          
          if (item.isPack) {
            console.log(`🔍 [DEBUG] Payment API - Creating product_instance for pack`)
            // For packs, we need to create a product_instance for the pack
            const [packInstanceResult] = await connection.query(
              `INSERT INTO product_instance (product_type, product_id, size_id, quantity) 
               VALUES ('cookie_pack', ?, ?, ?)`,
              [
                item.id, // pack_id
                1, // default size_id for packs
                1 // default quantity
              ]
            );
            productInstanceId = (packInstanceResult as any).insertId;
            console.log(`🔍 [DEBUG] Payment API - Created product_instance for pack with ID: ${productInstanceId}`)
            
            // Create product_instance_flavor records for each flavor
            console.log(`🔍 [DEBUG] Payment API - Creating flavor records for ${item.flavors.length} flavors`)
            for (const flavor of item.flavors) {
              await connection.query(
                `INSERT INTO product_instance_flavor (product_instance_id, flavor_id, size_id, quantity) 
                 VALUES (?, ?, ?, ?)`,
                [
                  productInstanceId,
                  flavor.id,
                  flavor.size === 'Mini' ? 1 : flavor.size === 'Medium' ? 2 : 3, // Map size to size_id
                  flavor.quantity
                ]
              );
              console.log(`🔍 [DEBUG] Payment API - Created flavor record for ${flavor.name}`)
            }
          } else {
            console.log(`🔍 [DEBUG] Payment API - Creating product_instance for individual product`)
            // For individual products, create product_instance
            const [productInstanceResult] = await connection.query(
              `INSERT INTO product_instance (product_type, product_id, size_id, quantity) 
               VALUES ('beverage', ?, ?, ?)`,
              [
                item.id, // product_id
                1, // default size_id
                1 // default quantity
              ]
            );
            productInstanceId = (productInstanceResult as any).insertId;
            console.log(`🔍 [DEBUG] Payment API - Created product_instance for product with ID: ${productInstanceId}`)
          }
          
          // Create order_item record with unit_price
          console.log(`🔍 [DEBUG] Payment API - Creating order_item with productInstanceId: ${productInstanceId}, quantity: ${item.quantity}, unit_price: ${item.basePrice}`)
          await connection.query(
            `INSERT INTO order_items (order_id, product_instance_id, quantity, unit_price) 
             VALUES (?, ?, ?, ?)`,
            [
              orderId,
              productInstanceId,
              item.quantity,
              item.basePrice
            ]
          );
          
          console.log(`✅ Created order item for ${item.name} with quantity ${item.quantity}`);
        } catch (itemError) {
          console.error(`❌ Error creating order item for ${item.name}:`, itemError);
          // Continue with other items even if one fails
        }
      }

      // Update stock for items (order items will be handled separately when we have proper schema)
      for (const item of orderData.cart.items) {
        if (item.isPack) {
          // For packs, update flavor stock instead of product stock
          for (const flavor of item.flavors) {
            const stockField = `stock_quantity_${flavor.size.toLowerCase()}`;
            await connection.query(
              `UPDATE flavors SET ${stockField} = ${stockField} - ? WHERE id = ?`,
              [flavor.quantity, flavor.id]
            );
          }
        } else {
          // For individual products, update product stock
          await connection.query(
            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [item.quantity, item.id]
          );
        }
      }

      // Clear cart
      await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

      return { orderId };
    });

    const { orderId } = result;

    if (paymentMethod === 'cod') {
      // Cash on Delivery - order is complete
      try {
        // Send order confirmation email
        await emailService.sendOrderConfirmationEmail(
          orderData.customerInfo.email, 
          orderId.toString(), 
          {
            items: orderData.cart.items,
            subtotal: orderData.cart.subtotal,
            deliveryFee: orderData.cart.deliveryFee,
            total: orderData.cart.total,
            status: 'pending',
            paymentMethod: 'cod',
            customerInfo: orderData.customerInfo,
            deliveryAddress: orderData.deliveryAddress
          }
        );
        console.log('✅ Order confirmation email sent for COD order');
      } catch (emailError) {
        console.error('❌ Failed to send order confirmation email:', emailError);
        // Don't fail the order if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Order placed successfully with Cash on Delivery',
        data: {
          orderId
        }
      });
    } else {
      // Paymob payment - generate payment URL
      console.log('🔍 [DEBUG] Payment API - Generating Paymob payment')
      const { paymentToken, paymentUrl } = await generatePaymobPayment(orderData, orderData.customerInfo, orderId);

      console.log('🔍 [DEBUG] Payment API - Paymob payment generated')
      console.log('🔍 [DEBUG] Payment API - Payment Token:', paymentToken)
      console.log('🔍 [DEBUG] Payment API - Payment URL:', paymentUrl)

      // Store payment token for webhook validation
      await databaseService.query(
        'UPDATE orders SET payment_token = ? WHERE id = ?',
        [paymentToken, orderId]
      );

      console.log('🔍 [DEBUG] Payment API - Payment token stored in database')

      const responseData = {
        success: true,
        message: 'Payment URL generated successfully',
        data: {
          orderId,
          paymentUrl,
          paymentToken
        }
      };

      console.log('🔍 [DEBUG] Payment API - Final Response Data:', responseData)
      console.log('🔍 [DEBUG] Payment API - Payment URL in response:', responseData.data.paymentUrl)
      console.log('🔍 [DEBUG] Payment API - Payment Token in response:', responseData.data.paymentToken)

      return NextResponse.json(responseData);
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process payment',
      error: 'Internal server error'
    }, { status: 500 });
  }
}