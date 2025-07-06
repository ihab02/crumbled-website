import { NextResponse } from "next/server"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    // Check authentication using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = databaseService
    
    // Get user ID
    const userResult = await db.query(
      'SELECT id FROM customers WHERE email = ?',
      [session.user.email]
    );

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = userResult[0].id;

    // Get user orders
    const ordersResult = await db.query(
      `SELECT 
        o.id,
        o.total,
        o.status,
        o.created_at,
        o.payment_method,
        o.delivery_address,
        o.delivery_city,
        o.delivery_zone,
        o.delivery_fee,
        o.subtotal
       FROM orders o
       WHERE o.customer_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      ordersResult.map(async (order: any) => {
        const itemsResult = await db.query(
          `SELECT 
            oi.id,
            oi.quantity,
            oi.unit_price,
            p.name as product_name,
            pt.name as product_type
           FROM order_items oi
           LEFT JOIN product_instance pi ON oi.product_instance_id = pi.id
           LEFT JOIN products p ON pi.product_id = p.id
           LEFT JOIN product_types pt ON p.product_type_id = pt.id
           WHERE oi.order_id = ?`,
          [order.id]
        );

        // Get flavors for each item
        const itemsWithFlavors = await Promise.all(
          itemsResult.map(async (item: any) => {
            const flavorsResult = await db.query(
              `SELECT 
                oif.flavor_name,
                oif.quantity as flavor_quantity,
                oif.size_label
               FROM order_item_flavors oif
               WHERE oif.order_item_id = ?`,
              [item.id]
            );

            return {
              ...item,
              flavors: flavorsResult || []
            };
          })
        );

        return {
          ...order,
          items: itemsWithFlavors
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: ordersWithItems || []
    });
  } catch (error) {
    console.error("Error fetching user orders:", error)
    return NextResponse.json({ error: "Failed to fetch user orders" }, { status: 500 })
  }
}
