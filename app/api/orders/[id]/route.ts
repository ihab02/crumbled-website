import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = Number.parseInt(params.id)

    if (isNaN(orderId)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid order ID" 
      }, { status: 400 })
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    
    // Get order details with customer information
    let orderResult;
    
    if (session?.user?.email) {
      // Authenticated user - get their order
      orderResult = await databaseService.query(
        `SELECT o.*, 
                c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone, c.type as customer_type
         FROM orders o 
         JOIN customers c ON o.customer_id = c.id 
         WHERE o.id = ? AND c.email = ?`,
        [orderId, session.user.email]
      );
    } else {
      // Guest user - get order without email restriction (for guest orders)
      orderResult = await databaseService.query(
        `SELECT o.*, 
                c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone, c.type as customer_type
         FROM orders o 
         JOIN customers c ON o.customer_id = c.id 
         WHERE o.id = ? AND c.type = 'guest'`,
        [orderId]
      );
    }

    const orderArray = Array.isArray(orderResult) ? orderResult : (orderResult ? [orderResult] : []);

    if (orderArray.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Order not found" 
      }, { status: 404 })
    }

    const order = orderArray[0];

    // Get order items with product details
    const itemsResult = await databaseService.query(
      `SELECT oi.*, 
              pi.product_type, pi.product_id, pi.size_id,
              p.name as product_name, p.image_url as product_image
       FROM order_items oi
       JOIN product_instance pi ON oi.product_instance_id = pi.id
       LEFT JOIN products p ON pi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    const itemsArray = Array.isArray(itemsResult) ? itemsResult : (itemsResult ? [itemsResult] : []);

    // Get flavor details for each order item
    const itemsWithFlavors = await Promise.all(itemsArray.map(async (item: any) => {
      // Try to use the new columns if available
      let flavors = [];
      let isPack = item.product_type === 'pack';
      if (isPack) {
        // Try to get from product_instance_flavor (new columns)
        const flavorResult = await databaseService.query(
          `SELECT 
            COALESCE(pif.flavor_name, f.name) as flavor_name,
            COALESCE(pif.size_name, 
              CASE pif.size_id WHEN 1 THEN 'Mini' WHEN 2 THEN 'Medium' WHEN 3 THEN 'Large' ELSE 'Unknown' END
            ) as size_name,
            pif.quantity
           FROM product_instance_flavor pif
           LEFT JOIN flavors f ON pif.flavor_id = f.id
           WHERE pif.product_instance_id = ?`,
          [item.product_instance_id]
        );
        flavors = (Array.isArray(flavorResult) ? flavorResult : (flavorResult ? [flavorResult] : []))
          .map((f: any) => ({
            flavor_name: f.flavor_name,
            size_name: f.size_name,
            quantity: f.quantity
          }));
      }
      return {
        id: item.id,
        product_name: item.product_name || item.product_name,
        product_type: item.product_type,
        pack_size: item.pack_size || null, // This comes from order_items table
        quantity: item.quantity,
        unit_price: item.unit_price,
        flavors: isPack ? flavors : [],
      };
    }));

    // Calculate totals from order items
    let subtotal = 0;
    for (const item of itemsWithFlavors) {
      subtotal += Number(item.unit_price) * Number(item.quantity);
    }

    // Default values for missing columns
    const deliveryFee = order.delivery_fee || 30.00;
    const calculatedSubtotal = order.subtotal || subtotal;

    // Format the order data
    const formattedOrder = {
      id: order.id,
      order_status: order.status,
      customer_name: `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Guest User',
      customer_email: order.customer_email || 'No email provided',
      customer_phone: order.customer_phone || 'No phone provided',
      delivery_address: order.delivery_address || 'Address will be provided during delivery',
      delivery_additional_info: order.delivery_additional_info || null,
      delivery_city: order.delivery_city || 'Cairo',
      delivery_zone: order.delivery_zone || 'General',
      delivery_fee: deliveryFee,
      subtotal: calculatedSubtotal,
      total_amount: order.total, // Use the total from orders table
      payment_method: order.payment_method || 'cash',
      created_at: order.created_at,
      items: itemsWithFlavors
    };

    console.log('🔍 [DEBUG] Orders API - Formatted order data:', formattedOrder);

    return NextResponse.json({
      success: true,
      order: formattedOrder
    })
  } catch (error) {
    console.error("Error fetching order details:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch order details" 
    }, { status: 500 })
  }
}
