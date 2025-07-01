import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { verifyJWT } from '@/lib/middleware/auth';
import { cookies } from 'next/headers';

interface PaymentMethod {
  enabled: boolean;
  name: string;
  description: string;
}

interface PaymentMethods {
  cod: PaymentMethod;
  paymob: PaymentMethod;
}

// GET /api/admin/settings/payment-methods
export async function GET() {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('adminToken');
    
    if (!adminToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      verifyJWT(adminToken.value, 'admin');
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

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

    return NextResponse.json({
      success: true,
      paymentMethods
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/payment-methods
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('adminToken');
    
    if (!adminToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      verifyJWT(adminToken.value, 'admin');
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { paymentMethods } = await request.json();

    // Validate that at least one payment method is enabled
    const enabledMethods = Object.values(paymentMethods).filter((method: any) => method.enabled);
    if (enabledMethods.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one payment method must be enabled' },
        { status: 400 }
      );
    }

    // Validate payment methods structure
    const requiredMethods = ['cod', 'paymob'];
    for (const methodKey of requiredMethods) {
      if (!paymentMethods[methodKey]) {
        return NextResponse.json(
          { success: false, error: `Payment method ${methodKey} is required` },
          { status: 400 }
        );
      }
      
      const method = paymentMethods[methodKey];
      if (typeof method.enabled !== 'boolean' || typeof method.name !== 'string' || typeof method.description !== 'string') {
        return NextResponse.json(
          { success: false, error: `Invalid structure for payment method ${methodKey}` },
          { status: 400 }
        );
      }
    }

    const paymentMethodsJson = JSON.stringify(paymentMethods);

    await databaseService.query(
      'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      ['payment_methods', paymentMethodsJson, paymentMethodsJson]
    );

    return NextResponse.json({
      success: true,
      message: 'Payment methods updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment methods:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment methods' },
      { status: 500 }
    );
  }
} 