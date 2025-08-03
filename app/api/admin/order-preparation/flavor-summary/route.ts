import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/middleware/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  let connection;
  try {
    // Auth
    const token = request.cookies.get('adminToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyJWT(token);
    if (!decoded || decoded.type !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get query param
    const { searchParams } = new URL(request.url);
    const includeTomorrow = searchParams.get('includeTomorrow') === 'true';

    connection = await pool.getConnection();

    // Get orders with status 'pending' or 'confirmed'
    const [orders] = await connection.query(`
      SELECT 
        o.id,
        o.expected_delivery_date,
        oi.flavor_details
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status IN ('pending', 'confirmed')
        AND oi.flavor_details IS NOT NULL
        AND oi.flavor_details != ''
    `);

    // Filter orders for today or tomorrow only (not both)
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const filteredOrders = orders.filter((order) => {
      const date = order.expected_delivery_date ? new Date(order.expected_delivery_date) : null;
      if (!date) return false;
      if (includeTomorrow) {
        return date.toDateString() === tomorrow.toDateString();
      } else {
        return true; // include all pending/confirmed orders regardless of date
      }
    });

    // Aggregate flavors
    const flavorMap = new Map<
      string,
      { total_quantity: number; orders_count: Set<number>; flavor_id: number; flavor_name: string; size_name: string }
    >();

    filteredOrders.forEach((order: any) => {
      let flavorDetails = order.flavor_details;
      if (typeof flavorDetails === 'string') {
        try {
          flavorDetails = JSON.parse(flavorDetails);
        } catch (e) {
          flavorDetails = [];
        }
      }
      if (Array.isArray(flavorDetails)) {
        flavorDetails.forEach((flavor: any) => {
          const key = `${flavor.id}_${flavor.size}`;
          if (!flavorMap.has(key)) {
            flavorMap.set(key, {
              total_quantity: 0,
              orders_count: new Set(),
              flavor_id: flavor.id,
              flavor_name: flavor.name,
              size_name: flavor.size,
            });
          }
          const entry = flavorMap.get(key)!;
          entry.total_quantity += Number(flavor.quantity) || 0;
          entry.orders_count.add(order.id);
        });
      }
    });

    // Get images
    const flavorSummary = await Promise.all(
      Array.from(flavorMap.entries()).map(async ([key, data]) => {
        let image_url = null;
        try {
          const [rows] = await connection.query(
            'SELECT image_url FROM flavor_images WHERE flavor_id = ? AND is_cover = 1 LIMIT 1',
            [data.flavor_id]
          );
          if (rows && rows.length > 0) image_url = rows[0].image_url;
        } catch {}
        return {
          flavor_id: data.flavor_id,
          flavor_name: data.flavor_name,
          size_name: data.size_name,
          total_quantity: data.total_quantity,
          orders_count: data.orders_count.size,
          image_url,
        };
      })
    );

    flavorSummary.sort((a, b) => b.total_quantity - a.total_quantity);

    return NextResponse.json({
      success: true,
      flavorSummary,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
} 