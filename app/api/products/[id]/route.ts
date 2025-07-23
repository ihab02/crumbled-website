import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';

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

    // Get available flavors based on product's flavor size with review statistics
    const flavorsResult = await databaseService.query(
      `SELECT f.*, 
        COALESCE(f.total_reviews, 0) as total_reviews,
        COALESCE(f.average_rating, 0.00) as average_rating,
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
      WHERE f.is_active = 1 AND f.is_enabled = 1 AND f.deleted_at IS NULL
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
        is_active: Boolean(flavor.is_active),
        total_reviews: parseInt(flavor.total_reviews) || 0,
        average_rating: parseFloat(flavor.average_rating) || 0
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();

    // Validate required fields
    if (!id || !data.name || !data.product_type_id || !data.base_price || !data.flavor_size) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate count for packs
    if (data.is_pack && (!data.count || data.count < 1)) {
      return NextResponse.json(
        { success: false, error: 'Pack must have a count of at least 1' },
        { status: 400 }
      );
    }

    // Only generate pack image if it's a pack and no image was uploaded
    let imageUrl = data.image_url;
    if (data.is_pack && !imageUrl) {
      // Optionally generate image here if needed
      imageUrl = null;
    }

    // Get old stock for logging
    let oldStock = 0;
    if (data.log_history) {
      const [rows] = await databaseService.query('SELECT stock_quantity FROM products WHERE id = ?', [id]);
      if (Array.isArray(rows) && rows.length > 0) {
        oldStock = rows[0].stock_quantity;
      }
    }

    // Update all product fields
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
        is_active = ?,
        display_order = ?,
        stock_quantity = ?,
        is_available = ?,
        updated_at = NOW()
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
        data.display_order || 0,
        data.stock_quantity || 0,
        data.is_available ? 1 : 0,
        id
      ]
    );

    // Log stock change if requested
    if (data.log_history) {
      await databaseService.query(
        `INSERT INTO stock_history (item_id, item_type, old_quantity, new_quantity, change_amount, change_type, notes, changed_by) VALUES (?, 'product', ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.old_quantity ?? oldStock,
          data.stock_quantity || 0,
          data.change_amount || ((data.stock_quantity || 0) - (data.old_quantity ?? oldStock)),
          data.change_type || 'replacement',
          data.notes || '',
          'Admin'
        ]
      );
    }

    revalidatePath('/admin/products');
    return NextResponse.json({ 
      success: true, 
      message: 'Product updated successfully' 
    });
  } catch (error) {
    console.error('Error updating product:', error);
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