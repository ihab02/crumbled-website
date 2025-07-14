import { NextResponse } from 'next/server';
import { ViewService } from '@/lib/services/viewService';
import { databaseService } from '@/lib/services/databaseService';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';
import { revalidatePath } from 'next/cache';

// GET all product types
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    // Get show_deleted parameter from URL
    const { searchParams } = new URL(request.url);
    const showDeleted = searchParams.get('show_deleted') === 'true';

    // If admin token exists, update preferences and get all/deleted items
    if (adminToken) {
      try {
        const decoded = verifyJWT(adminToken, 'admin') as any;
        const adminUserId = decoded.id;

        // Update admin view preferences
        await ViewService.updateAdminViewPreferences(adminUserId, 'product_types', showDeleted);

        // Get product types using ViewService
        const productTypes = await ViewService.getProductTypes(showDeleted);

        // Convert is_active from number to boolean and add status
        const processedProductTypes = productTypes.map((pt: any) => ({
          ...pt,
          is_active: Boolean(pt.is_active),
          status: pt.status || (pt.deleted_at ? 'deleted' : pt.is_active ? 'active' : 'disabled')
        }));

        return NextResponse.json({
          success: true,
          productTypes: processedProductTypes
        });
      } catch (error) {
        console.warn('Admin token verification failed, falling back to public view:', error);
      }
    }

    // Fallback to public view (only active product types)
    const productTypes = await ViewService.getProductTypes(false);

    // Convert is_active from number to boolean
    const processedProductTypes = productTypes.map((pt: any) => ({
      ...pt,
      is_active: Boolean(pt.is_active)
    }));

    return NextResponse.json({
      success: true,
      productTypes: processedProductTypes
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
    ) as any;

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