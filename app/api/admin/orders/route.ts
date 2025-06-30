import { type NextRequest, NextResponse } from "next/server"
import { databaseService } from '@/lib/services/databaseService'
import { verifyJWT } from '@/lib/middleware/auth'

const db = databaseService

// Helper function to safely extract arrays from database query results
function safeExtractArray(result: any): any[] {
  if (Array.isArray(result)) {
    return result
  }
  if (result && Array.isArray(result[0])) {
    return result[0]
  }
  if (result && typeof result === 'object' && result[0]) {
    return Array.isArray(result[0]) ? result[0] : []
  }
  return []
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all orders with customer information
    const ordersResult = await db.query(`
      SELECT 
        o.id,
        o.total,
        o.status,
        o.created_at,
        o.updated_at,
        o.payment_method,
        o.payment_status,
        o.transaction_id,
        o.guest_otp,
        o.otp_verified,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.id as customer_id
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `)

    console.log('Orders query result:', ordersResult)
    console.log('Orders result type:', typeof ordersResult)
    console.log('Orders result length:', Array.isArray(ordersResult) ? ordersResult.length : 'Not an array')

    // Extract orders from the result - handle different possible structures
    const orders = safeExtractArray(ordersResult)
    
    console.log('Extracted orders:', orders)
    console.log('Orders type:', typeof orders)
    console.log('Orders is array:', Array.isArray(orders))
    console.log('Orders length:', orders.length)

    // For each order, fetch the order items
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        try {
          // Fetch order items
          console.log(`🔍 [DEBUG] Fetching order items for order ${order.id}`)
          
          // Try the new schema first (product_instance based)
          let orderItemsResult = await db.query(`
            SELECT 
              oi.id,
              oi.quantity,
              oi.unit_price,
              oi.product_instance_id,
              pi.product_type,
              pi.product_id,
              pi.size_id,
              cs.label as size_label,
              CASE 
                WHEN pi.product_type = 'cookie_pack' THEN cp.name
                WHEN pi.product_type = 'beverage' THEN p.name
                WHEN pi.product_type = 'cake' THEN p.name
                ELSE 'Unknown Product'
              END as product_name
            FROM order_items oi
            LEFT JOIN product_instance pi ON oi.product_instance_id = pi.id
            LEFT JOIN cookie_size cs ON pi.size_id = cs.id
            LEFT JOIN cookie_pack cp ON pi.product_id = cp.id AND pi.product_type = 'cookie_pack'
            LEFT JOIN products p ON pi.product_id = p.id AND pi.product_type IN ('beverage', 'cake')
            WHERE oi.order_id = ?
          `, [order.id])

          let orderItems = safeExtractArray(orderItemsResult)
          console.log(`🔍 [DEBUG] New schema order items result for order ${order.id}:`, orderItems)
          
          // If no items found with new schema, try old schema
          if (orderItems.length === 0) {
            console.log(`🔍 [DEBUG] No items found with new schema, trying old schema for order ${order.id}`)
            orderItemsResult = await db.query(`
              SELECT 
                oi.id,
                oi.quantity,
                oi.unit_price,
                'legacy' as product_type,
                oi.product_instance_id as product_id,
                1 as size_id,
                'Standard' as size_label,
                'Legacy Product' as product_name
              FROM order_items oi
              WHERE oi.order_id = ?
            `, [order.id])
            
            orderItems = safeExtractArray(orderItemsResult)
            console.log(`🔍 [DEBUG] Old schema order items result for order ${order.id}:`, orderItems)
          }
          
          console.log(`🔍 [DEBUG] Final order items for order ${order.id}:`, orderItems)

          // Get flavors for cookie packs
          const itemsWithFlavors = await Promise.all(
            orderItems.map(async (item) => {
              try {
                if (item.product_type === 'cookie_pack') {
                  const flavorsResult = await db.query(`
                    SELECT 
                      f.name as flavor_name,
                      pif.quantity as flavor_quantity,
                      cs.label as size_label
                    FROM product_instance_flavor pif
                    LEFT JOIN flavors f ON pif.flavor_id = f.id
                    LEFT JOIN cookie_size cs ON pif.size_id = cs.id
                    WHERE pif.product_instance_id = ?
                  `, [item.product_instance_id])
                  
                  const flavors = safeExtractArray(flavorsResult)
                  
                  return {
                    ...item,
                    flavors: flavors
                  }
                }
                return item
              } catch (flavorError) {
                console.error(`Error fetching flavors for item ${item.id}:`, flavorError)
                return {
                  ...item,
                  flavors: []
                }
              }
            })
          )

          return {
            ...order,
            items: itemsWithFlavors
          }
        } catch (itemError) {
          console.error(`Error fetching items for order ${order.id}:`, itemError)
          return {
            ...order,
            items: []
          }
        }
      })
    )

    return NextResponse.json(ordersWithItems)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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