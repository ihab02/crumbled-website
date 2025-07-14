import { NextResponse } from 'next/server';
import { ViewService } from '@/lib/services/viewService';
import { databaseService } from '@/lib/services/databaseService';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';
import { revalidatePath } from 'next/cache';

// GET single product type
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productType = await databaseService.query(
      'SELECT * FROM product_types WHERE id = ?',
      [params.id]
    );

    if (!productType || productType.length === 0) {
      return NextResponse.json(
        { error: 'Product type not found' },
        { status: 404 }
      );
    }

    // Convert is_active from number to boolean
    const processedProductType = {
      ...productType[0],
      is_active: Boolean(productType[0].is_active)
    };

    return NextResponse.json({
      success: true,
      productType: processedProductType
    });
  } catch (error) {
    console.error('Error fetching product type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product type' },
      { status: 500 }
    );
  }
}

// PUT update product type
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { name, description, display_order, is_active } = data;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    await databaseService.query(
      'UPDATE product_types SET name = ?, description = ?, display_order = ?, is_active = ? WHERE id = ?',
      [name, description || null, display_order || 0, is_active ? 1 : 0, params.id]
    );

    const updatedProductType = await databaseService.query(
      'SELECT * FROM product_types WHERE id = ?',
      [params.id]
    );

    // Convert is_active from number to boolean
    const processedProductType = {
      ...updatedProductType[0],
      is_active: Boolean(updatedProductType[0].is_active)
    };

    revalidatePath('/admin/product-types');
    return NextResponse.json({
      success: true,
      message: 'Product type updated successfully',
      productType: processedProductType
    });
  } catch (error) {
    console.error('Error updating product type:', error);
    return NextResponse.json(
      { error: 'Failed to update product type' },
      { status: 500 }
    );
  }
}

// DELETE product type (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let decoded;
    try {
      decoded = verifyJWT(adminToken, 'admin') as any;
    } catch (error) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const adminUserId = decoded.id;
    const productTypeId = parseInt(params.id);

    // Use ViewService to soft delete the product type
    const success = await ViewService.softDelete('product_types', productTypeId, adminUserId, 'Deleted via admin interface');

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to soft delete product type' },
        { status: 500 }
      );
    }

    revalidatePath('/admin/product-types');
    return NextResponse.json({
      success: true,
      message: 'Product type soft deleted successfully'
    });
  } catch (error) {
    console.error('Error soft deleting product type:', error);
    return NextResponse.json(
      { error: 'Failed to soft delete product type' },
      { status: 500 }
    );
  }
} 