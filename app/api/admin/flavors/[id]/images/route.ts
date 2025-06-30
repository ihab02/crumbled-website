import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
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

export async function POST(
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
    const { image_url, is_cover } = body;

    const result = await databaseService.transaction(async (connection) => {
      // If this is a cover image, unset any existing cover image
      if (is_cover) {
        await connection.execute(
          'UPDATE flavor_images SET is_cover = false WHERE flavor_id = ?',
          [params.id]
        );
      }

      // Insert the new image
      const [insertResult] = await connection.execute(
        'INSERT INTO flavor_images (flavor_id, image_url, is_cover) VALUES (?, ?, ?)',
        [params.id, image_url, is_cover]
      );

      return (insertResult as any).insertId;
    });

    return NextResponse.json({
      id: result,
      message: 'Image added successfully'
    });
  } catch (error) {
    console.error('Error adding image:', error);
    return NextResponse.json(
      { error: 'Failed to add image' },
      { status: 500 }
    );
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

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    await databaseService.transaction(async (connection) => {
      // Delete the image
      await connection.execute(
        'DELETE FROM flavor_images WHERE id = ? AND flavor_id = ?',
        [imageId, params.id]
      );
    });

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { imageId, is_cover } = body;

    await databaseService.transaction(async (connection) => {
      // If setting as cover image, unset any existing cover image
      if (is_cover) {
        await connection.execute(
          'UPDATE flavor_images SET is_cover = false WHERE flavor_id = ?',
          [params.id]
        );
      }

      // Update the image
      await connection.execute(
        'UPDATE flavor_images SET is_cover = ? WHERE id = ? AND flavor_id = ?',
        [is_cover, imageId, params.id]
      );
    });

    return NextResponse.json({ message: 'Image updated successfully' });
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
} 