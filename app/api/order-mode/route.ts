import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

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
    // Get current order mode
    const [result] = await databaseService.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['order_mode']
    );

    let orderMode: 'stock_based' | 'preorder' = 'stock_based';
    
    if (Array.isArray(result) && result.length > 0) {
      orderMode = (result[0] as any).setting_value as 'stock_based' | 'preorder';
    }

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