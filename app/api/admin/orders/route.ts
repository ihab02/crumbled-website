import { NextResponse } from 'next/server'
import { databaseService } from '@/lib/services/databaseService'
import { verifyJWT } from '@/lib/middleware/auth'
import pool from '@/lib/db'

const db = databaseService

// Helper function to safely extract arrays from database results
function safeExtractArray(result: any): any[] {
  if (Array.isArray(result)) {
    return result
  }
  if (result && typeof result === 'object' && result.length !== undefined) {
    return Array.from(result)
  }
  return result ? [result] : []
}

export async function GET(request: any) {
  try {
    // Verify admin authentication using JWT token
    const token = request.cookies.get('adminToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const hideCancelled = searchParams.get('hideCancelled') === 'true'
    const hideDelivered = searchParams.get('hideDelivered') === 'true'
    const showTodayDelivery = searchParams.get('showTodayDelivery') === 'true'
    const includeTomorrow = searchParams.get('includeTomorrow') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'DESC'

    // Build WHERE clause for filtering
    let whereClause = ''
    let params: any[] = []
    let conditions: string[] = []

    // Date filtering
    if (fromDate || toDate) {
      if (fromDate && toDate) {
        conditions.push('DATE(o.created_at) BETWEEN ? AND ?')
        params.push(fromDate, toDate)
      } else if (fromDate) {
        conditions.push('DATE(o.created_at) >= ?')
        params.push(fromDate)
      } else if (toDate) {
        conditions.push('DATE(o.created_at) <= ?')
        params.push(toDate)
      }
    }

    // Hide cancelled orders
    if (hideCancelled) {
      conditions.push('o.status != "cancelled"')
    }

    // Hide delivered orders
    if (hideDelivered) {
      conditions.push('o.status != "delivered"')
    }

    // Show only orders to deliver today or tomorrow if filter is set
    if (showTodayDelivery) {
      if (includeTomorrow) {
        conditions.push('DATE(o.expected_delivery_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)')
      } else {
        conditions.push('DATE(o.expected_delivery_date) <= CURDATE()')
      }
    }

    // Combine all conditions
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ')
    }

    // Always add limit and offset parameters
    const allParams = params.length > 0 ? [...params, limit, offset] : [limit, offset]

    // Debug logging
    console.log('🔍 [DEBUG] Admin Orders API - Parameters:', {
      fromDate,
      toDate,
      hideCancelled,
      hideDelivered,
      showTodayDelivery,
      params,
      limit,
      offset,
      allParams,
      paramsLength: params.length,
      allParamsLength: allParams.length,
      whereClause
    })

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
    `
    const countResult = await db.query(countSql, params)
    const totalOrders = safeExtractArray(countResult)[0]?.total || 0
    const totalPages = Math.ceil(totalOrders / limit)

    // Fetch orders with customer information and pagination
    const ordersSql = `
      SELECT 
        o.id,
        o.customer_id,
        o.total,
        o.status,
        o.payment_method,
        o.payment_status,
        o.delivery_address,
        o.delivery_city,
        o.delivery_zone,
        o.delivery_fee,
        o.subtotal,
        o.created_at,
        o.updated_at,
        o.promo_code_id,
        o.discount_amount,
        pc.code AS promo_code,
        COALESCE(CONCAT(IFNULL(c.first_name, ''), ' ', IFNULL(c.last_name, '')), 'Guest User') as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        z.delivery_days,
        COALESCE(o.expected_delivery_date, 
          CASE 
            WHEN z.delivery_days > 0 THEN 
              DATE_ADD(o.created_at, INTERVAL z.delivery_days DAY)
            ELSE 
              o.created_at
          END
        ) as expected_delivery_date,
        o.delivery_man_id,
        dm.name as delivery_man_name,
        dm.mobile_phone as delivery_man_phone,
        dts.name as delivery_time_slot_name,
        dts.from_hour,
        dts.to_hour,
        (o.subtotal + o.delivery_fee - COALESCE(o.discount_amount, 0)) as total_after_discount
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN promo_codes pc ON o.promo_code_id = pc.id
       LEFT JOIN zones z ON o.delivery_zone COLLATE utf8mb4_general_ci = z.name COLLATE utf8mb4_general_ci
       LEFT JOIN delivery_men dm ON o.delivery_man_id = dm.id
       LEFT JOIN delivery_time_slots dts ON z.time_slot_id = dts.id
       ${whereClause}
       ORDER BY ${sortBy === 'expected_delivery_date' ? 'o.expected_delivery_date' : 
                 sortBy === 'delivery_zone' ? 'o.delivery_zone' :
                 sortBy === 'total_after_discount' ? 'total_after_discount' :
                 sortBy === 'customer_name' ? 'customer_name' :
                 sortBy === 'status' ? 'o.status' :
                 sortBy === 'created_at' ? 'o.created_at' : 'o.created_at'} ${sortOrder}
       LIMIT ? OFFSET ?
    `
    
    console.log('🔍 [DEBUG] Admin Orders API - Executing query with params:', allParams)
    
    // Try a simpler approach - use query instead of execute
    let connection;
    try {
      connection = await pool.getConnection();
      const [rows] = await connection.query(ordersSql, allParams);
      const ordersArray = Array.isArray(rows) ? rows : [rows];
      
      // Get order items for each order
      const ordersWithItems = await Promise.all(
        ordersArray.map(async (order: any) => {
          const itemsSql = `
            SELECT 
              oi.id,
              oi.quantity,
              oi.unit_price,
              oi.product_name,
              oi.product_type,
              oi.pack_size,
              oi.flavor_details
            FROM order_items oi
            WHERE oi.order_id = ?
          `;
          
          const [itemsRows] = await connection.query(itemsSql, [order.id]);
          const items = Array.isArray(itemsRows) ? itemsRows : [itemsRows];
          
          // Parse flavor details for each item
          const itemsWithFlavors = items.map((item: any) => {
            let flavors = [];
            let flavorDetails = item.flavor_details;
            if (typeof flavorDetails === 'string') {
              try {
                flavorDetails = JSON.parse(flavorDetails);
              } catch (error) {
                console.error('Error parsing flavor details:', error, 'value:', flavorDetails);
                flavorDetails = [];
              }
            }
            if (Array.isArray(flavorDetails)) {
              flavors = flavorDetails;
            }
            return {
              ...item,
              flavors: Array.isArray(flavors) ? flavors : []
            };
          });
          
          return {
            ...order,
            items: itemsWithFlavors
          };
        })
      );
      
      // Debug logging to see what data is returned
      console.log('🔍 [DEBUG] Admin Orders API - Sample order data:', ordersWithItems[0]);
      
              return NextResponse.json({
          success: true,
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
    } finally {
      if (connection) {
        connection.release();
      }
    }

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: any) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyJWT(token)
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

    // Handle status column truncation issue
    let finalStatus = status;
    if (status === 'out_for_delivery') {
      try {
        // Try with the full status first
        await db.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          [status, orderId]
        );
      } catch (error) {
        console.log('Status column too small, using shorter status');
        // If that fails, use a shorter status
        finalStatus = 'delivering';
        await db.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          [finalStatus, orderId]
        );
      }
    } else {
      // For other statuses, try the original first
      try {
        await db.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          [status, orderId]
        );
      } catch (error) {
        console.log('Status column too small, using shorter status');
        // If that fails, truncate the status
        finalStatus = status.substring(0, 20);
        await db.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          [finalStatus, orderId]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      actualStatus: finalStatus
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
} 