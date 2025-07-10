import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'Order ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const db = databaseService;
    
    // Check order_items table structure
    let orderItemsStructure;
    try {
      orderItemsStructure = await db.query("DESCRIBE order_items");
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'order_items table does not exist',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // Check product_instance table structure
    let productInstanceStructure;
    try {
      productInstanceStructure = await db.query("DESCRIBE product_instance");
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'product_instance table does not exist',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // Check products table structure
    let productsStructure;
    try {
      productsStructure = await db.query("DESCRIBE products");
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'products table does not exist',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // Get order items for the specific order
    let orderItems;
    try {
      orderItems = await db.query(
        `SELECT 
          oi.id,
          oi.quantity,
          oi.unit_price,
          oi.product_instance_id,
          pi.product_type,
          pi.product_id,
          p.name as product_name,
          p.image_url as product_image
         FROM order_items oi
         LEFT JOIN product_instance pi ON oi.product_instance_id = pi.id
         LEFT JOIN products p ON pi.product_id = p.id
         WHERE oi.order_id = ?`,
        [orderId]
      );
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Error fetching order items',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // Get raw order items without joins
    let rawOrderItems;
    try {
      rawOrderItems = await db.query(
        'SELECT * FROM order_items WHERE order_id = ?',
        [orderId]
      );
    } catch (error) {
      rawOrderItems = [];
    }

    return NextResponse.json({
      success: true,
      orderId: orderId,
      orderItemsStructure: orderItemsStructure,
      productInstanceStructure: productInstanceStructure,
      productsStructure: productsStructure,
      orderItems: orderItems || [],
      rawOrderItems: rawOrderItems || [],
      orderItemsCount: (orderItems || []).length,
      rawOrderItemsCount: (rawOrderItems || []).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error in debug order items API',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 