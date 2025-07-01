import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { verifyJWT } from '@/lib/middleware/auth';

interface OrderModeRequest {
  orderMode: 'stock_based' | 'preorder';
}

interface OrderModeResponse {
  success: boolean;
  message: string;
  data?: {
    orderMode: 'stock_based' | 'preorder';
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<OrderModeResponse>> {
  try {
    console.log('=== Admin Order Mode GET Request ===');
    
    // Check for admin token in cookies
    const adminToken = request.cookies.get('adminToken');
    console.log('Admin token found:', !!adminToken?.value);
    
    if (!adminToken?.value) {
      console.log('No admin token found');
      return NextResponse.json({
        success: false,
        message: 'Unauthorized',
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Verify admin token
    let isAdmin = false;
    let decodedToken = null;
    try {
      decodedToken = verifyJWT(adminToken.value, 'admin');
      console.log('Decoded token:', decodedToken);
      isAdmin = true; // If verifyJWT doesn't throw, it's a valid admin token
      console.log('Is admin:', isAdmin);
    } catch (error) {
      console.error('Token verification error:', error);
      isAdmin = false;
    }

    if (!isAdmin) {
      console.log('Not admin, returning 403');
      return NextResponse.json({
        success: false,
        message: 'Unauthorized',
        error: 'Admin access required'
      }, { status: 403 });
    }

    console.log('Admin verified, proceeding with order mode fetch');

    // Get current order mode
    const [result] = await databaseService.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['order_mode']
    );

    let orderMode: 'stock_based' | 'preorder' = 'stock_based';
    
    if (Array.isArray(result) && result.length > 0) {
      orderMode = (result[0] as any).setting_value as 'stock_based' | 'preorder';
    }

    console.log('Order mode retrieved:', orderMode);

    return NextResponse.json({
      success: true,
      message: 'Order mode retrieved successfully',
      data: {
        orderMode
      }
    });

  } catch (error) {
    console.error('Error getting order mode:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get order mode',
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<OrderModeResponse>> {
  try {
    // Check for admin token in cookies
    const adminToken = request.cookies.get('adminToken');
    
    if (!adminToken?.value) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized',
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Verify admin token
    let isAdmin = false;
    try {
      const decoded = verifyJWT(adminToken.value, 'admin');
      isAdmin = true; // If verifyJWT doesn't throw, it's a valid admin token
    } catch (error) {
      console.error('Token verification error:', error);
      isAdmin = false;
    }

    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized',
        error: 'Admin access required'
      }, { status: 403 });
    }

    const { orderMode } = await request.json() as OrderModeRequest;

    // Validate order mode
    if (!['stock_based', 'preorder'].includes(orderMode)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid order mode',
        error: 'Order mode must be either "stock_based" or "preorder"'
      }, { status: 400 });
    }

    // Update order mode
    await databaseService.query(
      `INSERT INTO site_settings (setting_key, setting_value, updated_at) 
       VALUES (?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
      ['order_mode', orderMode, orderMode]
    );

    return NextResponse.json({
      success: true,
      message: 'Order mode updated successfully',
      data: {
        orderMode
      }
    });

  } catch (error) {
    console.error('Error updating order mode:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update order mode',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 