import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
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
      orderMode,
      message: 'Order mode test successful'
    });

  } catch (error) {
    console.error('Error testing order mode:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test order mode'
    }, { status: 500 });
  }
} 