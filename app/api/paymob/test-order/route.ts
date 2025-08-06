import { NextRequest, NextResponse } from 'next/server';
import { paymobService } from '@/lib/services/paymobService';

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    
    console.log('🔍 Test Paymob order creation:', orderData);

    // Create Paymob order
    const paymobOrder = await paymobService.createOrder(orderData);

    return NextResponse.json({
      success: true,
      message: 'Test Paymob order created successfully',
      data: {
        orderId: paymobOrder.id,
        amount: paymobOrder.amount_cents / 100,
        currency: paymobOrder.currency
      }
    });

  } catch (error) {
    console.error('❌ Test Paymob order creation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create test Paymob order',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 