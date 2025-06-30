import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

interface PaymentMethod {
  enabled: boolean;
  name: string;
  description: string;
}

interface PaymentMethods {
  cod: PaymentMethod;
  paymob: PaymentMethod;
}

// GET /api/payment-methods - Public endpoint for checkout
export async function GET() {
  try {
    const [result] = await databaseService.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['payment_methods']
    );

    let paymentMethods: PaymentMethods = {
      cod: { enabled: true, name: 'Cash on Delivery', description: 'Pay when you receive your order' },
      paymob: { enabled: true, name: 'Paymob', description: 'Secure online payment' }
    };

    if (Array.isArray(result) && result.length > 0) {
      try {
        paymentMethods = JSON.parse((result[0] as any).setting_value);
      } catch (error) {
        console.error('Error parsing payment methods:', error);
      }
    }

    // Filter to only return enabled payment methods
    const enabledPaymentMethods: Record<string, PaymentMethod> = {};
    Object.entries(paymentMethods).forEach(([key, method]) => {
      if (method.enabled) {
        enabledPaymentMethods[key] = method;
      }
    });

    return NextResponse.json({
      success: true,
      paymentMethods: enabledPaymentMethods
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
} 