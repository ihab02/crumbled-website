import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

// GET all product types
export async function GET() {
  try {
    let connection;
    try {
      connection = await pool.getConnection();
      const [productTypes] = await connection.query(
        'SELECT * FROM product_types ORDER BY display_order ASC'
      );

      // Convert is_active from number to boolean
      const processedProductTypes = productTypes.map((pt: any) => ({
        ...pt,
        is_active: Boolean(pt.is_active)
      }));

      return NextResponse.json({
        success: true,
        productTypes: processedProductTypes
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error fetching product types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product types' },
      { status: 500 }
    );
  }
}

// POST new product type
export async function POST(request: Request) {
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
      const [result] = await connection.query(
        'INSERT INTO product_types (name, description, display_order, is_active) VALUES (?, ?, ?, ?)',
        [name, description || null, display_order || 0, is_active ? 1 : 0]
      );

      revalidatePath('/admin/product-types');
      return NextResponse.json({
        success: true,
        message: 'Product type created successfully',
        productType: {
          id: result.insertId,
          name,
          description,
          display_order,
          is_active
        }
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error creating product type:', error);
    return NextResponse.json(
      { error: 'Failed to create product type' },
      { status: 500 }
    );
  }
} 