import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    console.log('🔍 Debug User Orders - Session:', session);
    console.log('🔍 Debug User Orders - Session user:', session?.user);
    console.log('🔍 Debug User Orders - Session user email:', session?.user?.email);
    console.log('🔍 Debug User Orders - Email from query param:', email);
    
    // Use email from query param or session
    const userEmail = email || session?.user?.email;
    
    if (!userEmail) {
      return NextResponse.json({
        success: false,
        message: 'No email provided or found in session',
        session: session,
        timestamp: new Date().toISOString()
      });
    }
    console.log('🔍 Debug User Orders - Checking orders for email:', userEmail);

    // Get user ID
    const userResult = await databaseService.query(
      'SELECT id FROM customers WHERE email = ?',
      [userEmail]
    );

    console.log('🔍 Debug User Orders - User result:', userResult);

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found in database',
        email: userEmail,
        session: session,
        timestamp: new Date().toISOString()
      });
    }

    const userId = userResult[0].id;
    console.log('🔍 Debug User Orders - User ID:', userId);

    // Get user orders
    const ordersResult = await databaseService.query(
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

    console.log('🔍 Debug User Orders - Orders result:', ordersResult);
    console.log('🔍 Debug User Orders - Orders count:', Array.isArray(ordersResult) ? ordersResult.length : 0);

    // Also check all orders in the database
    const allOrdersResult = await databaseService.query(
      'SELECT id, customer_id, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10'
    );

    return NextResponse.json({
      success: true,
      email: userEmail,
      userId: userId,
      session: session,
      userOrders: ordersResult || [],
      userOrdersCount: Array.isArray(ordersResult) ? ordersResult.length : 0,
      allOrdersSample: allOrdersResult || [],
      allOrdersCount: Array.isArray(allOrdersResult) ? allOrdersResult.length : 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug User Orders error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 