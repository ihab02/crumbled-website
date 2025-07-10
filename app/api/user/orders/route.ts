import { NextResponse } from "next/server"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';
import { debugLog } from '@/lib/debug-utils';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await debugLog('User orders API called', { timestamp: new Date().toISOString() });
    
    // Check authentication using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      await debugLog('Unauthorized access attempt to user orders API', { email: session?.user?.email });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = databaseService
    
    // Get user ID
    const userResult = await db.query(
      'SELECT id FROM customers WHERE email = ?',
      [session.user.email]
    );

    if (!userResult || userResult.length === 0) {
      await debugLog('User not found in database', { email: session.user.email });
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = userResult[0].id;
    
    await debugLog('User orders query started', { userId, email: session.user.email });

    // Get user orders
    let ordersResult;
    try {
      ordersResult = await db.query(
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
      
      await debugLog('Orders query executed successfully', { 
        userId, 
        orderCount: ordersResult?.length || 0 
      });
    } catch (error) {
      await debugLog('Error executing orders query', { error: error.message, userId });
      console.error('Orders query error:', error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      (ordersResult || []).map(async (order: any) => {
        let itemsResult;
        try {
                      itemsResult = await db.query(
              `SELECT 
                oi.id,
                oi.quantity,
                oi.unit_price,
                oi.product_instance_id,
                pi.product_type,
                pi.product_id,
                CASE 
                  WHEN pi.product_type = 'cookie_pack' THEN COALESCE(cp.name, CONCAT('Cookie Pack (', pi.product_id, ')'))
                  WHEN pi.product_type = 'beverage' THEN COALESCE(p.name, CONCAT('Beverage (', pi.product_id, ')'))
                  WHEN pi.product_type = 'cake' THEN COALESCE(p.name, CONCAT('Cake (', pi.product_id, ')'))
                  ELSE CONCAT('Product (', pi.product_id, ')')
                END as product_name,
                CASE 
                  WHEN pi.product_type = 'cookie_pack' THEN NULL
                  ELSE p.image_url
                END as product_image
               FROM order_items oi
               LEFT JOIN product_instance pi ON oi.product_instance_id = pi.id
               LEFT JOIN products p ON pi.product_id = p.id AND pi.product_type IN ('beverage', 'cake')
               LEFT JOIN cookie_pack cp ON pi.product_id = cp.id AND pi.product_type = 'cookie_pack'
               WHERE oi.order_id = ?`,
              [order.id]
            );
        } catch (error) {
          await debugLog('Error fetching order items', { orderId: order.id, error: error.message });
          itemsResult = [];
        }

        // For now, skip flavors since the table might not exist
        const itemsWithFlavors = (itemsResult || []).map((item: any) => {
          debugLog('Processing order item', { 
            itemId: item.id, 
            productName: item.product_name, 
            productType: item.product_type,
            quantity: item.quantity,
            unitPrice: item.unit_price
          });
          
          return {
            ...item,
            flavors: []
          };
        });

        return {
          ...order,
          items: itemsWithFlavors
        };
      })
    );

    await debugLog('User orders query completed', { 
      userId, 
      orderCount: ordersWithItems?.length || 0 
    });

    return NextResponse.json({
      success: true,
      data: ordersWithItems || []
    });
  } catch (error) {
    await debugLog('Error in user orders API', { error: error.message, stack: error.stack });
    console.error("Error fetching user orders:", error)
    return NextResponse.json({ error: "Failed to fetch user orders" }, { status: 500 })
  }
}
