import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';
import { paymobService } from '@/lib/services/paymobService';

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
const generatePaymobPayment = async (orderData: any, customerInfo: any) => {
  try {
    console.log('🔍 [DEBUG] generatePaymobPayment - Starting Paymob payment generation')
    console.log('🔍 [DEBUG] generatePaymobPayment - Order Data:', orderData)
    console.log('🔍 [DEBUG] generatePaymobPayment - Customer Info:', customerInfo)

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

    // Get payment URL
    const paymentUrl = paymobService.getPaymentUrl(paymentKey.token);
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
      const orderStatus = paymentMethod === 'cod' ? 'Pending' : 'Unpaid';
      const paymentStatus = paymentMethod === 'cod' ? 'Pending' : 'Unpaid';

      let customerId = null;
      if (session?.user) {
        const [customerResult] = await connection.query('SELECT id FROM customers WHERE email = ?', [session.user.email]);
        if (Array.isArray(customerResult) && customerResult.length > 0) {
          customerId = (customerResult[0] as any).id;
        }
      }

      const [orderResult] = await connection.query(
        `INSERT INTO orders (
          customer_id, 
          total_amount, 
          delivery_fee, 
          subtotal,
          status, 
          payment_status, 
          payment_method,
          delivery_address,
          delivery_city,
          delivery_zone,
          customer_name,
          customer_email,
          customer_phone,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          customerId,
          orderData.cart.total,
          orderData.cart.deliveryFee,
          orderData.cart.subtotal,
          orderStatus,
          paymentStatus,
          paymentMethod,
          orderData.deliveryAddress.street_address,
          orderData.deliveryAddress.city_name,
          orderData.deliveryAddress.zone_name,
          orderData.customerInfo.name,
          orderData.customerInfo.email,
          orderData.customerInfo.phone
        ]
      );

      const orderId = (orderResult as any).insertId;

      // Create order items
      for (const item of orderData.cart.items) {
        await connection.query(
          `INSERT INTO order_items (
            order_id, 
            product_id, 
            quantity, 
            unit_price, 
            total_price,
            flavor_details
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.id,
            item.quantity,
            item.basePrice,
            item.total,
            item.flavorDetails
          ]
        );

        // Update product stock
        await connection.query(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.id]
        );
      }

      // Clear cart
      await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

      return { orderId };
    });

    const { orderId } = result;

    if (paymentMethod === 'cod') {
      // Cash on Delivery - order is complete
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
      const { paymentToken, paymentUrl } = await generatePaymobPayment(orderData, orderData.customerInfo);

      console.log('🔍 [DEBUG] Payment API - Paymob payment generated')
      console.log('🔍 [DEBUG] Payment API - Payment Token:', paymentToken)
      console.log('🔍 [DEBUG] Payment API - Payment URL:', paymentUrl)

      // Store payment token for webhook validation
      await databaseService.query(
        'UPDATE orders SET payment_token = ? WHERE id = ?',
        [paymentToken, orderId]
      );

      console.log('🔍 [DEBUG] Payment API - Payment token stored in database')

      return NextResponse.json({
        success: true,
        message: 'Payment URL generated successfully',
        data: {
          orderId,
          paymentUrl,
          paymentToken
        }
      });
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