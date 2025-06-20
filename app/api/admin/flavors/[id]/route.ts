import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const flavor = await db.query(`
      SELECT 
        f.*,
        JSON_OBJECT(
          'mini', JSON_OBJECT(
            'quantity', COALESCE(sm.quantity, 0),
            'min_threshold', COALESCE(sm.min_threshold, 0),
            'max_capacity', COALESCE(sm.max_capacity, 0)
          ),
          'large', JSON_OBJECT(
            'quantity', COALESCE(sl.quantity, 0),
            'min_threshold', COALESCE(sl.min_threshold, 0),
            'max_capacity', COALESCE(sl.max_capacity, 0)
          )
        ) as stock
      FROM flavors f
      LEFT JOIN flavor_stock sm ON f.id = sm.flavor_id AND sm.size = 'mini'
      LEFT JOIN flavor_stock sl ON f.id = sl.flavor_id AND sl.size = 'large'
      WHERE f.id = ?
    `, [params.id]);

    if (!flavor) {
      return new NextResponse('Flavor not found', { status: 404 });
    }

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { name, description, category, mini_price, medium_price, large_price, is_active } = body;

    if (!name || !description || !category || !mini_price || !medium_price || !large_price) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    await db.query(
      `UPDATE flavors 
       SET name = ?, description = ?, category = ?, 
           mini_price = ?, medium_price = ?, large_price = ?, is_active = ?
       WHERE id = ?`,
      [name, description, category, mini_price, medium_price, large_price, is_active, params.id]
    );

    return NextResponse.json({ id: params.id, ...body });
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First delete the associated stock records
    await db.query('DELETE FROM flavor_stock WHERE flavor_id = ?', [params.id]);
    
    // Then delete the flavor
    await db.query('DELETE FROM flavors WHERE id = ?', [params.id]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting flavor:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 