import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { revalidatePath } from 'next/cache';

// GET single product type
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [productType] = await databaseService.query(
      'SELECT * FROM product_types WHERE id = ?',
      [params.id]
    );

    if (!productType) {
      return NextResponse.json(
        { error: 'Product type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      productType
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

    const [updatedProductType] = await databaseService.query(
      'SELECT * FROM product_types WHERE id = ?',
      [params.id]
    );

    revalidatePath('/admin/product-types');
    return NextResponse.json({
      success: true,
      message: 'Product type updated successfully',
      productType: updatedProductType
    });
  } catch (error) {
    console.error('Error updating product type:', error);
    return NextResponse.json(
      { error: 'Failed to update product type' },
      { status: 500 }
    );
  }
}

// DELETE product type
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await databaseService.query(
      'DELETE FROM product_types WHERE id = ?',
      [params.id]
    );

    revalidatePath('/admin/product-types');
    return NextResponse.json({
      success: true,
      message: 'Product type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product type:', error);
    return NextResponse.json(
      { error: 'Failed to delete product type' },
      { status: 500 }
    );
  }
} 