import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { generatePackImage } from '@/utils/generatePackImage';
import { ViewService } from '@/lib/services/viewService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { verifyJWT } from '@/lib/middleware/auth';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showDeleted = searchParams.get('show_deleted') === 'true';
    
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
    
    // Debug logging
    console.log('Products API Debug:', {
      session: session ? { id: session.user?.id, email: session.user?.email } : null,
      adminToken: adminToken ? 'Present' : 'Not found',
      isAdmin,
      adminUser,
      showDeleted,
      shouldShowDeleted: isAdmin && showDeleted
    });
    
    // For customer-facing requests, always use active view
    // For admin requests, respect the show_deleted parameter
    const shouldShowDeleted = isAdmin && showDeleted;
    
    // Get products using ViewService
    const products = await ViewService.getProducts(shouldShowDeleted);
    
    // Convert base_price to number and add stock fields
    const productsWithNumbers = products.map((p: Product) => ({
      ...p,
      base_price: typeof p.base_price === 'string' ? parseFloat(p.base_price) : p.base_price,
      stock_quantity: parseInt(String(p.stock_quantity)) || 0,
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

    let connection;
    try {
      connection = await pool.getConnection();
      
      // Get the next display order
      const [maxOrderResult] = await connection.query(
        'SELECT COALESCE(MAX(display_order), 0) as max_order FROM products'
      );
      const maxOrder = maxOrderResult[0];
      const displayOrder = maxOrder.max_order + 1;

      console.log('Inserting product with data:', {
        ...data,
        image_url: imageUrl,
        display_order: displayOrder
      });

      const [result] = await connection.query(
        `INSERT INTO products (
          name, description, product_type_id, is_pack, count, flavor_size,
          base_price, image_url, is_active, display_order,
          total_reviews, average_rating,
          review_count_1_star, review_count_2_star, review_count_3_star, 
          review_count_4_star, review_count_5_star
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0.00, 0, 0, 0, 0, 0)`,
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
    } finally {
      if (connection) {
        connection.release();
      }
    }
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

    let connection;
    try {
      connection = await pool.getConnection();
      
      console.log('Updating product with data:', {
        ...data,
        image_url: imageUrl
      });

      await connection.query(
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
    } finally {
      if (connection) {
        connection.release();
      }
    }
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

// DELETE - Soft delete a product
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    const reason = searchParams.get('reason') || 'No reason provided';

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const success = await ViewService.softDelete(
      'products',
      parseInt(productId),
      parseInt(session.user.id),
      reason
    );

    if (success) {
      revalidatePath('/admin/products');
      return NextResponse.json({
        success: true,
        message: 'Product soft deleted successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to soft delete product' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error soft deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to soft delete product' },
      { status: 500 }
    );
  }
} 