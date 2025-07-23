import { type NextRequest, NextResponse } from "next/server"
import { databaseService } from '@/lib/services/databaseService'
import { sendOrderNotification } from "@/lib/sms-service"
import { EmailService } from '@/lib/email-service'

const db = databaseService

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface OrderData {
  items: OrderItem[];
  deliveryFee: number;
  customer: {
    name?: string;
    email?: string;
    phone: string;
  };
  deliveryAddress: {
    address: string;
    city: string;
    zone: string;
    delivery_fee?: number;
  };
  isGuest: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json()
    const { items, deliveryFee, customer, deliveryAddress, isGuest } = orderData

    // Validate required fields
    if (!items?.length || !customer?.phone || !deliveryAddress?.address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate total
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const total = subtotal + deliveryFee

    // Start transaction
    const result = await db.transaction(async (connection) => {
      // Insert order
      const [orderResult] = await connection.query(
        `INSERT INTO orders (
          customer_name,
          customer_email,
          customer_phone,
          delivery_address,
          delivery_city,
          delivery_zone,
          delivery_fee,
          subtotal,
          total,
          status,
          is_guest
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [
          customer.name || null,
          customer.email || null,
          customer.phone,
          deliveryAddress.address,
          deliveryAddress.city,
          deliveryAddress.zone,
          deliveryFee,
          subtotal,
          total,
          isGuest ? 1 : 0
        ]
      )

      const orderId = (orderResult as any).insertId

      // Insert order items
      for (const item of items) {
        await connection.query(
          `INSERT INTO order_items (
            order_id,
            product_id,
            name,
            price,
            quantity,
            image
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.id,
            item.name,
            item.price,
            item.quantity,
            item.image
          ]
        )
      }

      return orderId
    })

    // Send notifications
    try {
      // Send SMS notification
      await sendOrderNotification(customer.phone, result, 'pending')

      // Send email confirmation if email is provided
      if (customer.email) {
        await EmailService.sendOrderConfirmation(
          customer.email,
          {
            id: result,
            customer_name: customer.name || 'Valued Customer',
            customer_email: customer.email,
            items: items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.image
            })),
            subtotal,
            delivery_fee: deliveryFee,
            total
          }
        )
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
      // Don't fail the order if notifications fail
    }

    return NextResponse.json({
      success: true,
      orderId: result,
      message: 'Order placed successfully'
    })
  } catch (error) {
    console.error('Error placing order:', error)
    return NextResponse.json(
      { error: 'Failed to place order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')
    const customerPhone = searchParams.get('phone')

    if (!orderId || !customerPhone) {
      return NextResponse.json(
        { error: 'Order ID and customer phone are required' },
        { status: 400 }
      )
    }

    const [orders] = await db.query(
      `SELECT 
        o.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', oi.product_id,
            'name', oi.name,
            'price', oi.price,
            'quantity', oi.quantity,
            'image', oi.image
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ? AND o.customer_phone = ?
      GROUP BY o.id`,
      [orderId, customerPhone]
    )

    if (!(orders as any[]).length) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = (orders as any[])[0]
    order.items = JSON.parse(`[${order.items}]`)

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    // Update order status
    await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    )

    // Get order details for notification
    const [orders] = await db.query(
      'SELECT customer_email, customer_name, total FROM orders WHERE id = ?',
      [orderId]
    )

    const order = (orders as any[])[0]

    // Send email notification if email exists
    if (order?.customer_email) {
      await EmailService.sendOrderStatusUpdate(
        order.customer_email,
        {
          id: orderId,
          customer_name: order.customer_name || 'Valued Customer',
          customer_email: order.customer_email,
          status
        }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully'
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}
