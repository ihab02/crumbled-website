import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { getJwtSecret } from '@/lib/auth-config';

interface OrderModeRequest {
  orderMode: 'stock_based' | 'preorder';
}

interface OrderModeResponse {
  success: boolean;
  message: string;
  data?: {
    orderMode: 'stock_based' | 'preorder';
  };
  error?: string;
}

// JWT verification function (same as middleware)
async function verifyJWT(token: string, userType: 'customer' | 'admin'): Promise<any> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid token format');
    }
    
    // Decode header and payload
    const header = JSON.parse(atob(headerB64));
    const payload = JSON.parse(atob(payloadB64));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    
    // Import the secret key
    const secret = getJwtSecret(userType);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Verify the signature
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      data
    );

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    throw error;
  }
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
      decodedToken = await verifyJWT(adminToken.value, 'admin');
      console.log('Decoded token:', decodedToken);
      isAdmin = decodedToken.role === 'admin';
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
    const [result] = await databaseService.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['order_mode']
    );

    let orderMode: 'stock_based' | 'preorder' = 'stock_based';
    
    if (Array.isArray(result) && result.length > 0) {
      orderMode = (result[0] as any).setting_value as 'stock_based' | 'preorder';
    }

    console.log('Order mode retrieved:', orderMode);

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
      const decoded = await verifyJWT(adminToken.value, 'admin');
      isAdmin = decoded.role === 'admin';
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

    const { orderMode } = await request.json() as OrderModeRequest;

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

    return NextResponse.json({
      success: true,
      message: 'Order mode updated successfully',
      data: {
        orderMode
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