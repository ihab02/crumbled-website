import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { verifyJWT } from '@/lib/middleware/auth';

interface OrderModeRequest {
  orderMode?: 'stock_based' | 'preorder';
  timeWindowSettings?: {
    enabled: boolean;
    fromTime: string;
    toTime: string;
  };
}

interface OrderModeResponse {
  success: boolean;
  message: string;
  data?: {
    orderMode: 'stock_based' | 'preorder';
    timeWindowSettings?: {
      enabled: boolean;
      fromTime: string;
      toTime: string;
    };
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
    const [orderModeResult] = await databaseService.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['order_mode']
    );

    let orderMode: 'stock_based' | 'preorder' = 'stock_based';
    
    if (Array.isArray(orderModeResult) && orderModeResult.length > 0) {
      orderMode = (orderModeResult[0] as any).setting_value as 'stock_based' | 'preorder';
    }

    // Get time window settings
    const [timeWindowResult] = await databaseService.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['time_window_settings']
    );

    let timeWindowSettings = {
      enabled: false,
      fromTime: "08:00",
      toTime: "17:00"
    };
    
    if (Array.isArray(timeWindowResult) && timeWindowResult.length > 0) {
      try {
        timeWindowSettings = JSON.parse(timeWindowResult[0].setting_value);
      } catch (error) {
        console.error('Error parsing time window settings:', error);
      }
    }

    console.log('Order mode retrieved:', orderMode);
    console.log('Time window settings retrieved:', timeWindowSettings);

    return NextResponse.json({
      success: true,
      message: 'Order mode retrieved successfully',
      data: {
        orderMode,
        timeWindowSettings
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

    const { orderMode, timeWindowSettings } = await request.json() as OrderModeRequest;

    // Update order mode if provided
    if (orderMode) {
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
    }

    // Update time window settings if provided
    if (timeWindowSettings) {
      // Validate time window settings
      if (typeof timeWindowSettings.enabled !== 'boolean') {
        return NextResponse.json({
          success: false,
          message: 'Invalid time window settings',
          error: 'enabled must be a boolean'
        }, { status: 400 });
      }

      if (timeWindowSettings.enabled) {
        if (!timeWindowSettings.fromTime || !timeWindowSettings.toTime) {
          return NextResponse.json({
            success: false,
            message: 'Invalid time window settings',
            error: 'fromTime and toTime are required when enabled is true'
          }, { status: 400 });
        }
      }

      // Update time window settings
      await databaseService.query(
        `INSERT INTO site_settings (setting_key, setting_value, updated_at) 
         VALUES (?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
        ['time_window_settings', JSON.stringify(timeWindowSettings), JSON.stringify(timeWindowSettings)]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        orderMode: orderMode || 'stock_based',
        timeWindowSettings: timeWindowSettings || { enabled: false, fromTime: "08:00", toTime: "17:00" }
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