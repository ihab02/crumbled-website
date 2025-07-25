import { NextRequest, NextResponse } from 'next/server';
import { ViewService } from '@/lib/services/viewService';
import { revalidatePath } from 'next/cache';
import { verifyJWT } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication using custom admin token
    const adminToken = request.cookies.get('adminToken')?.value;
    
    if (!adminToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let adminUser = null;
    try {
      const decoded = verifyJWT(adminToken, 'admin') as any;
      if (decoded.type !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      adminUser = { id: decoded.id, email: decoded.email || 'admin@example.com' };
    } catch (error) {
      console.log('Admin token verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const success = await ViewService.restore(
      'products',
      parseInt(productId),
      parseInt(adminUser.id)
    );

    if (success) {
      revalidatePath('/admin/products');
      return NextResponse.json({
        success: true,
        message: 'Product restored successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to restore product' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error restoring product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore product' },
      { status: 500 }
    );
  }
} 