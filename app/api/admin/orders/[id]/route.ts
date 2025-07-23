import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = Number.parseInt(params.id);

    if (isNaN(orderId)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid order ID" 
      }, { status: 400 });
    }

    // Check admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 });
    }

    try {
      const decoded = verifyJWT(adminToken, 'admin');
      if (!decoded) {
        return NextResponse.json({ 
          success: false,
          error: "Invalid admin token" 
        }, { status: 401 });
      }
    } catch (error) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid admin token" 
      }, { status: 401 });
    }

    // Get order details with customer information
    const orderResult = await databaseService.query(
      `SELECT o.*, 
              c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone, c.type as customer_type, pc.code as promo_code
       FROM orders o 
       LEFT JOIN customers c ON o.customer_id = c.id 
       LEFT JOIN promo_codes pc ON o.promo_code_id = pc.id
       WHERE o.id = ?`,
      [orderId]
    );

    const orderArray = Array.isArray(orderResult) ? orderResult : (orderResult ? [orderResult] : []);

    if (orderArray.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Order not found" 
      }, { status: 404 });
    }

    const order = orderArray[0];

    // Get order items - the data is already in the order_items table
    const itemsResult = await databaseService.query(
      `SELECT oi.*
       FROM order_items oi
       WHERE oi.order_id = ?`,
      [orderId]
    );

    const itemsArray = Array.isArray(itemsResult) ? itemsResult : (itemsResult ? [itemsResult] : []);

    // Get flavor details for each order item
    const itemsWithFlavors = await Promise.all(itemsArray.map(async (item: any) => {
      let flavors = [];
      
      console.log('🔍 [DEBUG] Processing order item:', {
        id: item.id,
        product_name: item.product_name,
        product_type: item.product_type,
        flavor_details: item.flavor_details
      });
      
      // Get flavors from the flavor_details JSON column
      if (item.flavor_details) {
        try {
          if (typeof item.flavor_details === 'string') {
            flavors = JSON.parse(item.flavor_details);
          } else if (Array.isArray(item.flavor_details)) {
            flavors = item.flavor_details;
          }
          
          console.log('🔍 [DEBUG] Parsed flavors:', flavors);
          
          // Ensure flavors is an array and has the correct structure
          if (Array.isArray(flavors)) {
            flavors = flavors.map((flavor: any) => ({
              flavor_name: flavor.flavor_name || flavor.name || 'Unknown Flavor',
              size_name: flavor.size_name || flavor.size || 'Standard',
              quantity: flavor.quantity || 1
            }));
          }
        } catch (e) {
          console.error('Error parsing flavor_details JSON:', e);
          flavors = [];
        }
      }
      
      // Use the product name directly from order_items table
      const productName = item.product_name || 'Unknown Product';

      const result = {
        id: item.id,
        product_name: productName,
        product_type: item.product_type,
        pack_size: item.pack_size || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        flavors: flavors,
      };
      
      console.log('🔍 [DEBUG] Final item result:', result);
      
      return result;
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
      promo_code_id: order.promo_code_id,
      promo_code: order.promo_code,
      discount_amount: order.discount_amount,
      items: itemsWithFlavors
    };

    console.log('🔍 [DEBUG] Admin Orders API - Formatted order data:', formattedOrder);

    return NextResponse.json({
      success: true,
      order: formattedOrder
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch order details" 
    }, { status: 500 });
  }
} 