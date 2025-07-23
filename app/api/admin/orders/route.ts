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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build WHERE clause for date filtering
    let whereClause = ''
    let params: any[] = []

    if (fromDate || toDate) {
      whereClause = 'WHERE '
      if (fromDate && toDate) {
        whereClause += 'DATE(o.created_at) BETWEEN ? AND ?'
        params.push(fromDate, toDate)
      } else if (fromDate) {
        whereClause += 'DATE(o.created_at) >= ?'
        params.push(fromDate)
      } else if (toDate) {
        whereClause += 'DATE(o.created_at) <= ?'
        params.push(toDate)
      }
    }

    // Always add limit and offset parameters
    const allParams = params.length > 0 ? [...params, limit, offset] : [limit, offset]

    // Debug logging
    console.log('🔍 [DEBUG] Admin Orders API - Parameters:', {
      params,
      limit,
      offset,
      allParams,
      paramsLength: params.length,
      allParamsLength: allParams.length
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
        CASE 
          WHEN z.delivery_days > 0 THEN 
            DATE_ADD(o.created_at, INTERVAL z.delivery_days DAY)
          ELSE 
            o.created_at
        END as expected_delivery_date,
        o.delivery_man_id,
        dm.name as delivery_man_name,
        dm.mobile_phone as delivery_man_phone,
        dts.name as delivery_time_slot_name,
        dts.from_hour,
        dts.to_hour
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN promo_codes pc ON o.promo_code_id = pc.id
       LEFT JOIN zones z ON o.delivery_zone COLLATE utf8mb4_general_ci = z.name COLLATE utf8mb4_general_ci
       LEFT JOIN delivery_men dm ON o.delivery_man_id = dm.id
       LEFT JOIN delivery_time_slots dts ON z.time_slot_id = dts.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?
    `
    
    console.log('🔍 [DEBUG] Admin Orders API - Executing query with params:', allParams)
    
    // Try a simpler approach - use query instead of execute
    let connection;
    try {
      connection = await pool.getConnection();
      const [rows] = await connection.query(ordersSql, allParams);
      const ordersArray = Array.isArray(rows) ? rows : [rows];
      
      // Debug logging to see what data is returned
      console.log('🔍 [DEBUG] Admin Orders API - Sample order data:', ordersArray[0]);
      
      return NextResponse.json({
        success: true,
        data: ordersArray,
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