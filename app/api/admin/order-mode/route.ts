import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { verifyJWT } from '@/lib/middleware/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface OrderModeRequest {
  orderMode?: 'stock_based' | 'preorder';
  timeWindowSettings?: {
    enabled: boolean;
    fromTime: string;
    toTime: string;
  };
  cancellationSettings?: {
    enabled: boolean;
    showInEmail: boolean;
    showOnSuccessPage: boolean;
    timeWindowMinutes: number;
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
    cancellationSettings?: {
      enabled: boolean;
      showInEmail: boolean;
      showOnSuccessPage: boolean;
      timeWindowMinutes: number;
    };
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<OrderModeResponse>> {
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

    // Get current order mode
    const orderModeResult = await databaseService.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['order_mode']
    );

    console.log('[ADMIN DEBUG] Database result:', orderModeResult);

    let orderMode: 'stock_based' | 'preorder' = 'stock_based';
    
    if (Array.isArray(orderModeResult) && orderModeResult.length > 0) {
      orderMode = (orderModeResult[0] as any).setting_value as 'stock_based' | 'preorder';
      console.log('[ADMIN DEBUG] Setting order mode to:', orderMode);
    } else {
      console.log('[ADMIN DEBUG] No result found, using default stock_based');
    }

    // Get time window settings
    const timeWindowResult = await databaseService.query(
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

    return NextResponse.json({
      success: true,
      message: 'Order mode retrieved successfully',
      data: {
        orderMode,
        timeWindowSettings,
        cancellationSettings
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

    const { orderMode, timeWindowSettings, cancellationSettings } = await request.json() as OrderModeRequest;

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

    // Update cancellation settings if provided
    if (cancellationSettings) {
      // Validate cancellation settings
      if (typeof cancellationSettings.enabled !== 'boolean') {
        return NextResponse.json({
          success: false,
          message: 'Invalid cancellation settings',
          error: 'enabled must be a boolean'
        }, { status: 400 });
      }

      if (typeof cancellationSettings.showInEmail !== 'boolean') {
        return NextResponse.json({
          success: false,
          message: 'Invalid cancellation settings',
          error: 'showInEmail must be a boolean'
        }, { status: 400 });
      }

      if (typeof cancellationSettings.showOnSuccessPage !== 'boolean') {
        return NextResponse.json({
          success: false,
          message: 'Invalid cancellation settings',
          error: 'showOnSuccessPage must be a boolean'
        }, { status: 400 });
      }

      if (typeof cancellationSettings.timeWindowMinutes !== 'number' || cancellationSettings.timeWindowMinutes < 0) {
        return NextResponse.json({
          success: false,
          message: 'Invalid cancellation settings',
          error: 'timeWindowMinutes must be a positive number'
        }, { status: 400 });
      }

      // Update cancellation settings
      await databaseService.query(
        `INSERT INTO site_settings (setting_key, setting_value, updated_at) 
         VALUES (?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
        ['cancellation_settings', JSON.stringify(cancellationSettings), JSON.stringify(cancellationSettings)]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        orderMode: orderMode || 'stock_based',
        timeWindowSettings: timeWindowSettings || { enabled: false, fromTime: "08:00", toTime: "17:00" },
        cancellationSettings: cancellationSettings || { enabled: true, showInEmail: true, showOnSuccessPage: true, timeWindowMinutes: 30 }
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