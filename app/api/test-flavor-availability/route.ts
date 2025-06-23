import { NextRequest, NextResponse } from 'next/server';
import { orderModeService } from '@/lib/services/orderModeService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const flavorId = parseInt(searchParams.get('flavorId') || '1');
    const requestedQuantity = parseInt(searchParams.get('quantity') || '2');
    const size = (searchParams.get('size') || 'Large') as 'Mini' | 'Medium' | 'Large';
    
    console.log(`🔍 [TEST] Testing flavor availability:`, {
      flavorId,
      requestedQuantity,
      size
    });
    
    const availability = await orderModeService.checkFlavorAvailability(
      flavorId,
      requestedQuantity,
      size
    );
    
    return NextResponse.json({
      success: true,
      flavorId,
      requestedQuantity,
      size,
      availability,
      message: 'Flavor availability test completed'
    });

  } catch (error) {
    console.error('Error testing flavor availability:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test flavor availability',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 