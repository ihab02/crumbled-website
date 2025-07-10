import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verifyJWT(adminToken, 'admin');
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get all orders for the specified date with their flavor requirements
    const ordersQuery = `
      SELECT 
        o.id as order_id,
        o.customer_id,
        o.status as order_status,
        o.created_at,
        o.delivery_address,
        o.delivery_city,
        o.delivery_zone,
        COALESCE(CONCAT(c.first_name, ' ', c.last_name), 'Guest User') as customer_name,
        c.phone as customer_phone,
        oi.id as order_item_id,
        oi.product_name,
        oi.product_type,
        oi.pack_size,
        oi.flavor_details,
        oi.quantity as order_item_quantity,
        oi.unit_price,
        pif.flavor_id,
        pif.flavor_name,
        pif.size_name,
        pif.quantity as flavor_quantity,
        f.stock_quantity_mini,
        f.stock_quantity_medium,
        f.stock_quantity_large
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN product_instance pi ON oi.product_instance_id = pi.id
      LEFT JOIN product_instance_flavor pif ON pi.id = pif.product_instance_id
      LEFT JOIN flavors f ON pif.flavor_id = f.id
      WHERE DATE(o.created_at) = ?
        AND o.status IN ('pending', 'confirmed', 'preparing')
        AND oi.product_type = 'pack'
      ORDER BY o.created_at ASC, oi.id ASC
    `;

    const orders = await databaseService.query(ordersQuery, [date]);

    // Process the data to group by flavor and size
    const flavorProductionMap = new Map();
    const orderMap = new Map();

    orders.forEach((row: any) => {
      if (!row.flavor_id || !row.flavor_name) return;

      const key = `${row.flavor_id}-${row.size_name}`;
      
      if (!flavorProductionMap.has(key)) {
        flavorProductionMap.set(key, {
          id: row.flavor_id,
          flavor_name: row.flavor_name,
          size: row.size_name,
          total_quantity: 0,
          order_count: 0,
          orders: [],
          stock_quantity: 0,
          production_status: 'pending',
          priority: 'medium'
        });
      }

      const flavor = flavorProductionMap.get(key);
      flavor.total_quantity += row.flavor_quantity;
      
      // Add order if not already added
      if (!orderMap.has(row.order_id)) {
        orderMap.set(row.order_id, {
          order_id: row.order_id,
          customer_name: row.customer_name,
          delivery_date: row.created_at,
          status: row.order_status
        });
        flavor.order_count++;
      }

      // Add order details
      const orderDetail = {
        order_id: row.order_id,
        customer_name: row.customer_name,
        delivery_date: row.created_at,
        quantity: row.flavor_quantity,
        status: row.order_status
      };

      // Check if this order is already in the orders array
      const existingOrder = flavor.orders.find((o: any) => o.order_id === row.order_id);
      if (!existingOrder) {
        flavor.orders.push(orderDetail);
      } else {
        existingOrder.quantity += row.flavor_quantity;
      }

      // Set stock quantity based on size
      switch (row.size_name?.toLowerCase()) {
        case 'mini':
          flavor.stock_quantity = row.stock_quantity_mini || 0;
          break;
        case 'medium':
          flavor.stock_quantity = row.stock_quantity_medium || 0;
          break;
        case 'large':
          flavor.stock_quantity = row.stock_quantity_large || 0;
          break;
      }

      // Determine priority based on order urgency
      const orderDate = new Date(row.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 2) {
        flavor.priority = 'high';
      } else if (hoursDiff < 4) {
        flavor.priority = 'medium';
      } else {
        flavor.priority = 'low';
      }
    });

    const flavors = Array.from(flavorProductionMap.values());

    // Calculate summary
    const summary = {
      total_flavors: flavors.length,
      total_quantity: flavors.reduce((sum, f) => sum + f.total_quantity, 0),
      pending_flavors: flavors.filter(f => f.production_status === 'pending').length,
      in_progress_flavors: flavors.filter(f => f.production_status === 'in_progress').length,
      completed_flavors: flavors.filter(f => f.production_status === 'completed').length,
      urgent_orders: flavors.filter(f => f.priority === 'high').length
    };

    return NextResponse.json({
      success: true,
      flavors,
      summary,
      date
    });

  } catch (error) {
    console.error('Error fetching kitchen production data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production data' },
      { status: 500 }
    );
  }
} 