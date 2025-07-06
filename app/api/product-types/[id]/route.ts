import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

// GET single product type
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    let connection;
    try {
      connection = await pool.getConnection();
      const [productTypes] = await connection.query(
        'SELECT * FROM product_types WHERE id = ?',
        [params.id]
      );

      const productType = productTypes[0];
      if (!productType) {
        return NextResponse.json(
          { error: 'Product type not found' },
          { status: 404 }
        );
      }

      // Convert is_active from number to boolean
      const processedProductType = {
        ...productType,
        is_active: Boolean(productType.is_active)
      };

      return NextResponse.json({
        success: true,
        productType: processedProductType
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
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

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.query(
        'UPDATE product_types SET name = ?, description = ?, display_order = ?, is_active = ? WHERE id = ?',
        [name, description || null, display_order || 0, is_active ? 1 : 0, params.id]
      );

      const [updatedProductTypes] = await connection.query(
        'SELECT * FROM product_types WHERE id = ?',
        [params.id]
      );

      const updatedProductType = updatedProductTypes[0];

      // Convert is_active from number to boolean
      const processedProductType = {
        ...updatedProductType,
        is_active: Boolean(updatedProductType.is_active)
      };

      revalidatePath('/admin/product-types');
      return NextResponse.json({
        success: true,
        message: 'Product type updated successfully',
        productType: processedProductType
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
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
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.query(
        'DELETE FROM product_types WHERE id = ?',
        [params.id]
      );

      revalidatePath('/admin/product-types');
      return NextResponse.json({
        success: true,
        message: 'Product type deleted successfully'
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error deleting product type:', error);
    return NextResponse.json(
      { error: 'Failed to delete product type' },
      { status: 500 }
    );
  }
} 