import { NextRequest, NextResponse } from 'next/server';
import { ViewService } from '@/lib/services/viewService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { revalidatePath } from 'next/cache';
import { verifyJWT } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Check if this is an admin request using both NextAuth and custom admin token
    const session = await getServerSession(authOptions);
    const adminToken = request.cookies.get('adminToken')?.value;
    
    let isAdmin = false;
    let adminUser = null;
    
    // Check NextAuth session first
    if (session?.user?.id && session?.user?.email?.includes('admin')) {
      isAdmin = true;
      adminUser = session.user;
    }
    
    // Check custom admin token if NextAuth didn't work
    if (!isAdmin && adminToken) {
      try {
        const decoded = await verifyJWT(adminToken, 'admin') as any;
        isAdmin = decoded.type === 'admin';
        adminUser = { id: decoded.id, email: decoded.email || 'admin@example.com' };
      } catch (error) {
        console.log('Admin token verification failed:', error);
      }
    }
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
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