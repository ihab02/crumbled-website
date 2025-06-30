import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Proper JWT verification using Web Crypto API
async function verifyJWT(token: string): Promise<any> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    // Decode header and payload
    const header = JSON.parse(atob(headerB64));
    const payload = JSON.parse(atob(payloadB64));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    
    // Import the secret key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Verify the signature
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      data
    );

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    throw error;
  }
}

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
      const decoded = await verifyJWT(adminToken);
      if (decoded.role !== 'admin') {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    } catch (error) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const [flavorRows] = await db.query(`
      SELECT 
        f.*,
        fi.id as image_id,
        fi.image_url,
        fi.is_cover,
        fi.display_order,
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
      LEFT JOIN flavor_images fi ON f.id = fi.flavor_id
      LEFT JOIN flavor_stock sm ON f.id = sm.flavor_id AND sm.size = 'mini'
      LEFT JOIN flavor_stock sl ON f.id = sl.flavor_id AND sl.size = 'large'
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
      slug: flavorData.slug,
      description: flavorData.description,
      category: flavorData.category,
      mini_price: parseFloat(flavorData.mini_price) || 0,
      medium_price: parseFloat(flavorData.medium_price) || 0,
      large_price: parseFloat(flavorData.large_price) || 0,
      is_active: Boolean(flavorData.is_active),
      created_at: flavorData.created_at,
      updated_at: flavorData.updated_at,
      images: images,
      stock: flavorData.stock ? JSON.parse(flavorData.stock) : null
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
      const decoded = await verifyJWT(adminToken);
      if (decoded.role !== 'admin') {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    } catch (error) {
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
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
      const decoded = await verifyJWT(adminToken);
      if (decoded.role !== 'admin') {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    } catch (error) {
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