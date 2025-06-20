import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the product
    const [product] = await databaseService.query(
      `SELECT p.*, pt.name as product_type_name 
      FROM products p
      JOIN product_types pt ON p.product_type_id = pt.id
      WHERE p.id = ?`,
      [params.id]
    );

    console.log('Raw product data:', product);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get available flavors based on product's flavor size
    const flavorsResult = await databaseService.query(
      `SELECT f.*, 
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', fi.id,
              'image_url', fi.image_url,
              'is_cover', fi.is_cover
            )
          ),
          JSON_ARRAY()
        ) as images
      FROM flavors f
      LEFT JOIN flavor_images fi ON f.id = fi.flavor_id
      WHERE f.is_active = 1
      GROUP BY f.id
      ORDER BY f.created_at DESC`
    );

    console.log('Raw flavors result:', flavorsResult);

    // Ensure flavorsResult is an array
    const flavors = Array.isArray(flavorsResult) ? flavorsResult : [];
    console.log('Processed flavors array:', flavors);

    // Process flavors to include the correct price based on product's flavor size
    const processedFlavors = flavors.map((flavor: any) => {
      console.log('Processing flavor:', flavor);
      const price = flavor[`${product.flavor_size.toLowerCase()}_price`] || 0;
      const images = Array.isArray(flavor.images) ? flavor.images : [];
      const coverImage = images.find((img: any) => img.is_cover) || images[0];
      
      return {
        id: flavor.id,
        name: flavor.name,
        description: flavor.description,
        price: price,
        image_url: coverImage?.image_url || '/images/placeholder.png',
        category: flavor.category,
        is_active: Boolean(flavor.is_active)
      };
    });

    console.log('Processed flavors:', processedFlavors);

    // Convert base_price to number and add flavors to the product
    const productWithNumbers = {
      ...product,
      base_price: typeof product.base_price === 'string' ? parseFloat(product.base_price) : product.base_price,
      flavors: processedFlavors
    };

    console.log('Final product response:', productWithNumbers);

    return NextResponse.json(productWithNumbers);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, product_type_id, is_pack, count, flavor_size, base_price, image_url } = body;

    if (!name || !product_type_id || !base_price || !flavor_size) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If it's a pack, validate count
    if (is_pack && (!count || count < 1)) {
      return NextResponse.json(
        { success: false, error: 'Count is required for pack products' },
        { status: 400 }
      );
    }

    await databaseService.query(
      `UPDATE products SET 
        name = ?, 
        description = ?, 
        product_type_id = ?, 
        is_pack = ?, 
        count = ?,
        flavor_size = ?,
        base_price = ?, 
        image_url = ?
      WHERE id = ?`,
      [name, description, product_type_id, is_pack, count, flavor_size, base_price, image_url, params.id]
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
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await databaseService.query('DELETE FROM products WHERE id = ?', [params.id]);
    revalidatePath('/admin/products');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 