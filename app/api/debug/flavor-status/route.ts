import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const flavorId = searchParams.get('flavorId');
    const size = searchParams.get('size') || 'Large';
    
    if (!flavorId) {
      // Check all flavors 1, 2, 3
      const result = await databaseService.query(
        `SELECT id, name, is_active, allow_out_of_stock_order, 
                stock_quantity_mini, stock_quantity_medium, stock_quantity_large
         FROM flavors 
         WHERE id IN (1, 2, 3)`,
        []
      );

      return NextResponse.json({
        success: true,
        flavors: result,
        message: 'All flavors status check completed'
      });
    }

    // Test the exact query from order mode service
    const stockField = `stock_quantity_${size.toLowerCase()}`;
    const sql = `SELECT f.id, f.name, f.allow_out_of_stock_order, f.${stockField} FROM flavors f WHERE f.id = ? AND f.is_active = true AND f.is_enabled = true AND f.deleted_at IS NULL`;
    
    console.log(`🔍 [DEBUG] Testing query: ${sql} with params: [${flavorId}]`);
    
    const result = await databaseService.query(sql, [flavorId]);

    return NextResponse.json({
      success: true,
      flavorId: parseInt(flavorId),
      size,
      stockField,
      sql,
      result,
      resultLength: Array.isArray(result) ? result.length : 'not array',
      isFound: Array.isArray(result) && result.length > 0
    });

  } catch (error) {
    console.error('Error checking flavor status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check flavor status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 