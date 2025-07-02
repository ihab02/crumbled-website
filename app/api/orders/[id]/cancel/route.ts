import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated',
        error: 'Authentication required'
      }, { status: 401 });
    }

    console.log('🔍 [DEBUG] Cancel Order API - Order ID:', orderId);
    console.log('🔍 [DEBUG] Cancel Order API - Email:', session.user.email);

    // Check if order exists and belongs to the user
    const orderResult = await databaseService.query(
      `SELECT o.id, o.status, o.created_at, o.customer_id, c.email 
       FROM orders o 
       JOIN customers c ON o.customer_id = c.id 
       WHERE o.id = ? AND c.email = ?`,
      [orderId, session.user.email]
    );

    const orderArray = Array.isArray(orderResult) ? orderResult : (orderResult ? [orderResult] : []);

    if (orderArray.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Order not found',
        error: 'Order not found or does not belong to this user'
      }, { status: 404 });
    }

    const order = orderArray[0];
    console.log('🔍 [DEBUG] Cancel Order API - Order found:', order);

    // Check if order is already cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        message: 'Order already cancelled',
        error: 'This order has already been cancelled'
      }, { status: 400 });
    }

    // Check if order is already completed or shipped
    if (["completed", "shipped", "delivered"].includes(order.status)) {
      return NextResponse.json({
        success: false,
        message: 'Order cannot be cancelled',
        error: 'This order cannot be cancelled as it has already been processed'
      }, { status: 400 });
    }

    // Get cancellation settings
    const cancellationResult = await databaseService.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['cancellation_settings']
    );

    let cancellationSettings = {
      enabled: true,
      showInEmail: true,
      showOnSuccessPage: true,
      timeWindowMinutes: 30
    };
    
    if (Array.isArray(cancellationResult) && cancellationResult.length > 0) {
      try {
        cancellationSettings = JSON.parse(cancellationResult[0].setting_value);
      } catch (error) {
        console.error('Error parsing cancellation settings:', error);
      }
    }

    // Check if cancellation is enabled
    if (!cancellationSettings.enabled) {
      return NextResponse.json({
        success: false,
        message: 'Cancellation disabled',
        error: 'Order cancellation is currently disabled'
      }, { status: 400 });
    }

    // Check if order is within the configured time window
    const orderDate = new Date(order.created_at);
    const currentDate = new Date();
    const timeDifference = currentDate.getTime() - orderDate.getTime();
    const minutesDifference = timeDifference / (1000 * 60);

    if (minutesDifference > cancellationSettings.timeWindowMinutes) {
      return NextResponse.json({
        success: false,
        message: 'Cancellation time expired',
        error: `Orders can only be cancelled within ${cancellationSettings.timeWindowMinutes} minutes of placement`
      }, { status: 400 });
    }

    // Cancel the order
    await databaseService.query(
      'UPDATE orders SET status = "cancelled", updated_at = NOW() WHERE id = ?',
      [orderId]
    );

    console.log('🔍 [DEBUG] Cancel Order API - Order cancelled successfully');

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to cancel order',
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email parameter is required',
        error: 'Missing email parameter'
      }, { status: 400 });
    }

    console.log('🔍 [DEBUG] Cancel Order API - Order ID:', orderId);
    console.log('🔍 [DEBUG] Cancel Order API - Email:', email);

    // Check if order exists and belongs to the email
    const orderResult = await databaseService.query(
      `SELECT o.id, o.status, o.created_at, o.customer_id, c.email 
       FROM orders o 
       JOIN customers c ON o.customer_id = c.id 
       WHERE o.id = ? AND c.email = ?`,
      [orderId, email]
    );

    const orderArray = Array.isArray(orderResult) ? orderResult : (orderResult ? [orderResult] : []);

    if (orderArray.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Order not found',
        error: 'Order not found or does not belong to this email'
      }, { status: 404 });
    }

    const order = orderArray[0];
    console.log('🔍 [DEBUG] Cancel Order API - Order found:', order);

    // Check if order is already cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        message: 'Order already cancelled',
        error: 'This order has already been cancelled'
      }, { status: 400 });
    }

    // Check if order is already completed or shipped
    if (['completed', 'shipped', 'delivered'].includes(order.status)) {
      return NextResponse.json({
        success: false,
        message: 'Order cannot be cancelled',
        error: 'This order cannot be cancelled as it has already been processed'
      }, { status: 400 });
    }

    // Get cancellation settings
    const cancellationResult = await databaseService.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['cancellation_settings']
    );

    let cancellationSettings = {
      enabled: true,
      showInEmail: true,
      showOnSuccessPage: true,
      timeWindowMinutes: 30
    };
    
    if (Array.isArray(cancellationResult) && cancellationResult.length > 0) {
      try {
        cancellationSettings = JSON.parse(cancellationResult[0].setting_value);
      } catch (error) {
        console.error('Error parsing cancellation settings:', error);
      }
    }

    // Check if cancellation is enabled
    if (!cancellationSettings.enabled) {
      return NextResponse.json({
        success: false,
        message: 'Cancellation disabled',
        error: 'Order cancellation is currently disabled'
      }, { status: 400 });
    }

    // Check if order is within the configured time window
    const orderDate = new Date(order.created_at);
    const currentDate = new Date();
    const timeDifference = currentDate.getTime() - orderDate.getTime();
    const minutesDifference = timeDifference / (1000 * 60);

    if (minutesDifference > cancellationSettings.timeWindowMinutes) {
      return NextResponse.json({
        success: false,
        message: 'Cancellation time expired',
        error: `Orders can only be cancelled within ${cancellationSettings.timeWindowMinutes} minutes of placement`
      }, { status: 400 });
    }

    // Cancel the order
    await databaseService.query(
      'UPDATE orders SET status = "cancelled", updated_at = NOW() WHERE id = ?',
      [orderId]
    );

    console.log('🔍 [DEBUG] Cancel Order API - Order cancelled successfully');

    // Return a success page
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Cancelled</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #fdf2f8;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .container { 
            max-width: 500px; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .header { 
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
            padding: 30px; 
            color: white;
          }
          .content { 
            padding: 40px 30px; 
          }
          .success-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 20px;
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1 style="margin: 0; font-size: 28px;">Order Cancelled Successfully</h1>
          </div>
          <div class="content">
            <h2>Order #${orderId} has been cancelled</h2>
            <p>Your order has been successfully cancelled. If you had already made a payment, a refund will be processed within 3-5 business days.</p>
            <p>If you have any questions, please contact our customer support.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}" class="button">
              Return to Homepage
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to cancel order',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 