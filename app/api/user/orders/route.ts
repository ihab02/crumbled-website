import { NextResponse } from "next/server"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    // Check authentication using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get customer ID from email
    const customerResult = await databaseService.query(
      'SELECT id FROM customers WHERE email = ?',
      [session.user.email]
    );

    const customerArray = Array.isArray(customerResult) ? customerResult : (customerResult ? [customerResult] : []);

    if (customerArray.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const customerId = customerArray[0].id;

    // Get orders for this customer
    const ordersResult = await databaseService.query(
      `SELECT o.*, 
              c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone
       FROM orders o 
       JOIN customers c ON o.customer_id = c.id 
       WHERE o.customer_id = ? 
       ORDER BY o.created_at DESC`,
      [customerId]
    );

    const ordersArray = Array.isArray(ordersResult) ? ordersResult : (ordersResult ? [ordersResult] : []);

    // Get items for each order
    const ordersWithItems = await Promise.all(
      ordersArray.map(async (order) => {
        const itemsResult = await databaseService.query(
          `SELECT oi.*, 
                  pi.product_type, pi.product_id, pi.size_id,
                  p.name as product_name, p.image_url as product_image
           FROM order_items oi
           JOIN product_instance pi ON oi.product_instance_id = pi.id
           LEFT JOIN products p ON pi.product_id = p.id
           WHERE oi.order_id = ?`,
          [order.id]
        );

        const itemsArray = Array.isArray(itemsResult) ? itemsResult : (itemsResult ? [itemsResult] : []);

        // Get flavor details for each order item
        const itemsWithFlavors = await Promise.all(itemsArray.map(async (item: any) => {
          const flavorResult = await databaseService.query(
            `SELECT f.name, pif.quantity
             FROM product_instance_flavor pif
             JOIN flavors f ON pif.flavor_id = f.id
             WHERE pif.product_instance_id = ?`,
            [item.product_instance_id]
          );

          const flavorArray = Array.isArray(flavorResult) ? flavorResult : (flavorResult ? [flavorResult] : []);
          const flavorDetails = flavorArray.map((f: any) => `${f.name} (${f.quantity}x)`).join(', ');

          return {
            ...item,
            flavor_details: flavorDetails
          };
        }));

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
          delivery_fee: order.delivery_fee || '0.00',
          subtotal: order.subtotal || '0.00',
          total_amount: order.total || '0.00',
          payment_method: order.payment_method || 'cash',
          created_at: order.created_at,
          items: itemsWithFlavors.map((item: any) => ({
            id: item.id,
            product_name: item.product_name || 'Unknown Product',
            quantity: item.quantity,
            price: item.unit_price,
            flavor_details: item.flavor_details || 'No flavors specified'
          }))
        };

        return formattedOrder;
      })
    );

    return NextResponse.json({ orders: ordersWithItems })
  } catch (error) {
    console.error("Error fetching user orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
