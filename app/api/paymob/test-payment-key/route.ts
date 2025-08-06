import { NextRequest, NextResponse } from 'next/server';
import { paymobService } from '@/lib/services/paymobService';

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, billingData } = await request.json();
    
    console.log('🔍 Test Paymob payment key generation:', { orderId, amount, billingData });

    // Generate payment key
    const paymentKey = await paymobService.generatePaymentKey({
      orderId,
      amount,
      billingData
    });

    // Get payment URL
    const paymentUrl = paymobService.getPaymentUrl(paymentKey.token);

    return NextResponse.json({
      success: true,
      message: 'Test Paymob payment key generated successfully',
      data: {
        paymentToken: paymentKey.token,
        paymentUrl,
        orderId: paymentKey.id
      }
    });

  } catch (error) {
    console.error('❌ Test Paymob payment key generation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to generate test Paymob payment key',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 