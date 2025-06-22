import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { revalidatePath } from 'next/cache';
import { generatePackImage } from '@/utils/generatePackImage';

interface Product {
  id: number;
  name: string;
  description: string | null;
  product_type_id: number;
  is_pack: number;
  count: number | null;
  flavor_size: string;
  base_price: string | number;
  image_url: string;
  is_active: number;
  display_order: number;
  product_type_name: string;
  flavors_json: string | null;
  stock_quantity: number;
  is_available: boolean;
}

export async function GET() {
  try {
    const products = await databaseService.query(`
      SELECT p.*, pt.name as product_type_name
      FROM products p
      JOIN product_types pt ON p.product_type_id = pt.id
      ORDER BY p.display_order ASC
    `);

    // Convert base_price to number and add stock fields
    const productsWithNumbers = products.map((p: Product) => ({
      ...p,
      base_price: typeof p.base_price === 'string' ? parseFloat(p.base_price) : p.base_price,
      stock_quantity: parseInt(p.stock_quantity) || 0,
      is_available: Boolean(p.is_available)
    }));

    return NextResponse.json({ success: true, data: productsWithNumbers });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received product data:', data);

    // Validate required fields
    if (!data.name || !data.product_type_id || !data.base_price || !data.flavor_size) {
      console.error('Missing required fields:', { data });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate count for packs
    if (data.is_pack && (!data.count || data.count < 1)) {
      console.error('Invalid count for pack:', { data });
      return NextResponse.json(
        { success: false, error: 'Pack must have a count of at least 1' },
        { status: 400 }
      );
    }

    // Only generate pack image if it's a pack and no image was uploaded
    let imageUrl = data.image_url;
    if (data.is_pack && !imageUrl) {
      try {
        imageUrl = await generatePackImage(data.count, data.flavor_size);
      } catch (error) {
        console.error('Error generating pack image:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to generate pack image' },
          { status: 500 }
        );
      }
    }

    // Get the next display order
    const [maxOrder] = await databaseService.query(
      'SELECT COALESCE(MAX(display_order), 0) as max_order FROM products'
    );
    const displayOrder = maxOrder.max_order + 1;

    console.log('Inserting product with data:', {
      ...data,
      image_url: imageUrl,
      display_order: displayOrder
    });

    const result = await databaseService.query(
      `INSERT INTO products (
        name, description, product_type_id, is_pack, count, flavor_size,
        base_price, image_url, is_active, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.description || null,
        data.product_type_id,
        data.is_pack ? 1 : 0,
        data.count || null,
        data.flavor_size,
        data.base_price,
        imageUrl,
        data.is_active ? 1 : 0,
        displayOrder
      ]
    );

    revalidatePath('/admin/products');
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, error: 'A product with this name already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    console.log('Received product update data:', data);

    // Validate required fields
    if (!data.id || !data.name || !data.product_type_id || !data.base_price || !data.flavor_size) {
      console.error('Missing required fields:', { data });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate count for packs
    if (data.is_pack && (!data.count || data.count < 1)) {
      console.error('Invalid count for pack:', { data });
      return NextResponse.json(
        { success: false, error: 'Pack must have a count of at least 1' },
        { status: 400 }
      );
    }

    // Only generate pack image if it's a pack and no image was uploaded
    let imageUrl = data.image_url;
    if (data.is_pack && !imageUrl) {
      try {
        imageUrl = await generatePackImage(data.count, data.flavor_size);
      } catch (error) {
        console.error('Error generating pack image:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to generate pack image' },
          { status: 500 }
        );
      }
    }

    console.log('Updating product with data:', {
      ...data,
      image_url: imageUrl
    });

    await databaseService.query(
      `UPDATE products SET
        name = ?,
        description = ?,
        product_type_id = ?,
        is_pack = ?,
        count = ?,
        flavor_size = ?,
        base_price = ?,
        image_url = ?,
        is_active = ?
      WHERE id = ?`,
      [
        data.name,
        data.description || null,
        data.product_type_id,
        data.is_pack ? 1 : 0,
        data.count || null,
        data.flavor_size,
        data.base_price,
        imageUrl,
        data.is_active ? 1 : 0,
        data.id
      ]
    );

    revalidatePath('/admin/products');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating product:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, error: 'A product with this name already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
} 