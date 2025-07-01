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

    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Ensure parameters are valid numbers
    if (isNaN(page) || isNaN(limit) || isNaN(offset)) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
    `
    const countResult = await db.query(countSql)
    const totalOrders = safeExtractArray(countResult)[0]?.total || 0
    const totalPages = Math.ceil(totalOrders / limit)

    // Fetch orders with customer information and pagination
    // Use string interpolation for LIMIT and OFFSET since they are safe numeric values
    const sql = `
      SELECT 
        o.id,
        o.total,
        o.status,
        o.created_at,
        o.payment_method,
        o.guest_otp,
        o.otp_verified,
        o.customer_id,
        o.customer_phone,
        o.delivery_address,
        o.delivery_city,
        o.delivery_zone,
        o.zone,
        o.delivery_fee,
        o.subtotal,
        c.id as customer_id_from_customers,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        c.email as customer_email,
        COALESCE(c.phone, o.customer_phone) as customer_phone,
        COALESCE(z.delivery_days, 0) as delivery_days,
        dts.name as delivery_time_slot_name,
        dts.from_hour,
        dts.to_hour,
        CASE 
          WHEN COALESCE(z.delivery_days, 0) > 0 THEN 
            DATE_ADD(o.created_at, INTERVAL z.delivery_days DAY)
          ELSE NULL
        END as expected_delivery_date
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN zones z ON TRIM(o.delivery_zone) COLLATE utf8mb4_general_ci = TRIM(z.name) COLLATE utf8mb4_general_ci
      LEFT JOIN delivery_time_slots dts ON z.time_slot_id = dts.id
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    console.log('🔍 [DEBUG] Query with interpolated values - limit:', limit, 'offset:', offset)
    console.log('🔍 [DEBUG] Final SQL:', sql)
    
    const ordersResult = await db.query(sql, [])

    console.log('Orders query result:', ordersResult)
    console.log('Orders result type:', typeof ordersResult)
    console.log('Orders result length:', Array.isArray(ordersResult) ? ordersResult.length : 'Not an array')

    // Extract orders from the result - handle different possible structures
    const orders = safeExtractArray(ordersResult)
    
    // Debug: Check first order's delivery info
    if (orders.length > 0) {
      const firstOrder = orders[0]
      console.log('🔍 [DEBUG] First order delivery info:', {
        delivery_zone: firstOrder.delivery_zone,
        delivery_days: firstOrder.delivery_days,
        delivery_time_slot_name: firstOrder.delivery_time_slot_name,
        from_hour: firstOrder.from_hour,
        to_hour: firstOrder.to_hour,
        expected_delivery_date: firstOrder.expected_delivery_date
      })
    }
    
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
                WHEN pi.product_type = 'cookie_pack' THEN 
                  CASE 
                    WHEN pr.name IS NOT NULL THEN pr.name
                    WHEN pi.product_id BETWEEN 1 AND 100 THEN 'Custom Cookie Pack'
                    ELSE 'Cookie Pack'
                  END
                WHEN pi.product_type = 'beverage' THEN COALESCE(p.name, 'Beverage')
                WHEN pi.product_type = 'cake' THEN COALESCE(p.name, 'Cake')
                ELSE 'Product'
              END as product_name
            FROM order_items oi
            LEFT JOIN product_instance pi ON oi.product_instance_id = pi.id
            LEFT JOIN cookie_size cs ON pi.size_id = cs.id
            LEFT JOIN products pr ON pi.product_id = pr.id AND pi.product_type = 'cookie_pack'
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

    return NextResponse.json({
      orders: ordersWithItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })
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