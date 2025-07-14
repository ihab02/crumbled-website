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
    
    // Get user ID and phone
    const userResult = await db.query(
      'SELECT id, phone FROM customers WHERE email = ?',
      [session.user.email]
    );

    if (!userResult || userResult.length === 0) {
      await debugLog('User not found in database', { email: session.user.email });
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = userResult[0].id;
    const userPhone = userResult[0].phone || '';
    
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
              oi.product_name,
              oi.product_type,
              oi.pack_size,
              oi.flavor_details,
              CASE 
                WHEN pi.product_type = 'cookie_pack' THEN COALESCE(cp.name, CONCAT('Cookie Pack (', pi.product_id, ')'))
                WHEN pi.product_type = 'beverage' THEN COALESCE(p.name, CONCAT('Beverage (', pi.product_id, ')'))
                WHEN pi.product_type = 'cake' THEN COALESCE(p.name, CONCAT('Cake (', pi.product_id, ')'))
                ELSE CONCAT('Product (', pi.product_id, ')')
              END as fallback_product_name,
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

        // Process order items with flavor details
        const itemsWithFlavors = (itemsResult || []).map((item: any) => {
                      debugLog('Processing order item', { 
              itemId: item.id, 
              productName: item.product_name || item.fallback_product_name, 
              productType: item.product_type,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              hasFlavorDetails: !!item.flavor_details,
              flavorDetailsType: typeof item.flavor_details,
              flavorDetailsIsArray: Array.isArray(item.flavor_details)
            });
          
          let flavors = [];
          let flavorDetailsText = '';
          
                    // Parse flavor_details - MySQL returns JSON as objects
          if (item.flavor_details) {
            try {
              let flavorDetails = item.flavor_details;
              
              // MySQL returns JSON as objects, so we don't need to parse
              if (Array.isArray(flavorDetails)) {
                flavors = flavorDetails.map((flavor: any) => ({
                  id: flavor.id || null,
                  name: (flavor.flavor_name || flavor.name || 'Unknown Flavor').trim(),
                  quantity: flavor.quantity || 1,
                  size: (flavor.size_name || flavor.size || 'Standard').trim()
                }));
                
                flavorDetailsText = flavors.map((f: any) => `${f.quantity}x ${f.name} (${f.size})`).join(', ');
              }
            } catch (error) {
              debugLog('Error processing flavor_details', { 
                orderItemId: item.id, 
                flavorDetails: item.flavor_details,
                flavorDetailsType: typeof item.flavor_details,
                flavorDetailsIsArray: Array.isArray(item.flavor_details),
                error: error.message 
              });
            }
          }
          
                      const processedItem = {
              id: item.id,
              product_name: item.product_name || item.fallback_product_name || 'Product',
              quantity: item.quantity,
              price: item.unit_price,
              flavors: flavors,
              flavor_details: flavorDetailsText
            };
            
            debugLog('Processed order item', {
              itemId: item.id,
              productName: processedItem.product_name,
              flavorsCount: flavors.length,
              flavors: flavors,
              flavorDetailsText: flavorDetailsText
            });
            
            return processedItem;
        });

        return {
          id: order.id,
          order_status: order.status,
          customer_name: session.user.name || 'Customer',
          customer_email: session.user.email,
          customer_phone: userPhone,
          delivery_address: order.delivery_address,
          delivery_additional_info: '',
          delivery_city: order.delivery_city,
          delivery_zone: order.delivery_zone,
          delivery_fee: order.delivery_fee,
          subtotal: order.subtotal,
          total_amount: order.total,
          payment_method: order.payment_method,
          created_at: order.created_at,
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
      orders: ordersWithItems || []
    });
  } catch (error) {
    await debugLog('Error in user orders API', { error: error.message, stack: error.stack });
    console.error("Error fetching user orders:", error)
    return NextResponse.json({ error: "Failed to fetch user orders" }, { status: 500 })
  }
}
