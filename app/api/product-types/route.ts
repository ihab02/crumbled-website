import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { revalidatePath } from 'next/cache';

// GET all product types
export async function GET() {
  try {
    const productTypes = await databaseService.query(
      'SELECT * FROM product_types ORDER BY display_order ASC'
    );

    return NextResponse.json({
      success: true,
      productTypes
    });
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

    const result = await databaseService.query(
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
  } catch (error) {
    console.error('Error creating product type:', error);
    return NextResponse.json(
      { error: 'Failed to create product type' },
      { status: 500 }
    );
  }
} 