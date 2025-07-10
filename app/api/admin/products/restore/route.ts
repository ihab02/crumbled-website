import { NextRequest, NextResponse } from 'next/server';
import { ViewService } from '@/lib/services/viewService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
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
      parseInt(session.user.id)
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