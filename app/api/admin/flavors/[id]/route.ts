import { NextResponse } from 'next/server';
import { ViewService } from '@/lib/services/viewService';
import db from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
      verifyJWT(adminToken, 'admin');
    } catch (error) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const [flavorRows] = await db.query(`
      SELECT 
        f.*,
        fi.id as image_id,
        fi.image_url,
        fi.is_cover,
        fi.display_order
      FROM flavors f
      LEFT JOIN flavor_images fi ON f.id = fi.flavor_id
      WHERE f.id = ?
      ORDER BY fi.display_order
    `, [params.id]) as any;

    if (!flavorRows || (Array.isArray(flavorRows) && flavorRows.length === 0)) {
      return new NextResponse('Flavor not found', { status: 404 });
    }

    // Process the flavor data and group images
    const flavorRowsArray = Array.isArray(flavorRows) ? flavorRows : [flavorRows];
    const flavorData = flavorRowsArray[0];
    const images = flavorRowsArray
      .filter((row: any) => row.image_id)
      .map((row: any) => ({
        id: row.image_id,
        image_url: row.image_url,
        is_cover: Boolean(row.is_cover),
        display_order: row.display_order
      }));

    const flavor = {
      id: flavorData.id,
      name: flavorData.name,
      description: flavorData.description,
      category: flavorData.category || 'Classic',
      mini_price: parseFloat(flavorData.mini_price) || 0,
      medium_price: parseFloat(flavorData.medium_price) || 0,
      large_price: parseFloat(flavorData.large_price) || 0,
      is_active: Boolean(flavorData.is_active),
      is_enabled: Boolean(flavorData.is_enabled),
      created_at: flavorData.created_at,
      updated_at: flavorData.updated_at,
      deleted_at: flavorData.deleted_at,
      images: images
    };

    return NextResponse.json(flavor);
  } catch (error) {
    console.error('Error fetching flavor:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
      verifyJWT(adminToken, 'admin');
    } catch (error) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    console.log('PUT request body:', body); // Debug log

    // Check if this is a status toggle request (only is_active field)
    if (Object.keys(body).length === 1 && body.hasOwnProperty('is_active')) {
      // Simple status toggle - update is_enabled field (which controls customer visibility)
      await db.query(
        `UPDATE flavors SET is_enabled = ? WHERE id = ?`,
        [body.is_active, params.id]
      );

      return NextResponse.json({ 
        id: params.id, 
        is_enabled: body.is_active 
      });
    }

    // Check if this is an enabled toggle request (only is_enabled field)
    if (Object.keys(body).length === 1 && body.hasOwnProperty('is_enabled')) {
      // Simple enabled toggle
      await db.query(
        `UPDATE flavors SET is_enabled = ? WHERE id = ?`,
        [body.is_enabled, params.id]
      );

      return NextResponse.json({ 
        id: params.id, 
        is_enabled: body.is_enabled 
      });
    }

    // Full update - validate required fields
    const { name, description, category, mini_price, medium_price, large_price, is_active, is_enabled } = body;

    if (!name || !description || mini_price === undefined || medium_price === undefined || large_price === undefined) {
      console.log('Missing required fields:', { name, description, mini_price, medium_price, large_price });
      return new NextResponse('Missing required fields', { status: 400 });
    }

    await db.query(
      `UPDATE flavors 
       SET name = ?, description = ?, category = ?,
           mini_price = ?, medium_price = ?, large_price = ?, 
           is_active = ?, is_enabled = ?
       WHERE id = ?`,
      [name, description, category || 'Classic', mini_price, medium_price, large_price, is_active, is_enabled, params.id]
    );

    return NextResponse.json({ 
      id: params.id, 
      name, 
      description, 
      category: category || 'Classic',
      mini_price, 
      medium_price, 
      large_price, 
      is_active,
      is_enabled
    });
  } catch (error) {
    console.error('Error updating flavor:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

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
    const flavorId = parseInt(params.id);

    // Use ViewService to soft delete the flavor
    const success = await ViewService.softDelete('flavors', flavorId, adminUserId, 'Deleted via admin interface');

    if (!success) {
      return new NextResponse('Failed to soft delete flavor', { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error soft deleting flavor:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 