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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
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

    const flavorId = parseInt(params.id);
    const imageId = parseInt(params.imageId);

    // First check if this is the only image
    const [images] = await databaseService.query(
      'SELECT COUNT(*) as count FROM flavor_images WHERE flavor_id = ?',
      [flavorId]
    ) as any;

    if (images.count <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last image' },
        { status: 400 }
      );
    }

    // Check if this is a cover image
    const [image] = await databaseService.query(
      'SELECT is_cover FROM flavor_images WHERE id = ? AND flavor_id = ?',
      [imageId, flavorId]
    ) as any;

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // If this is a cover image, set another image as cover before deleting
    if (image.is_cover) {
      await databaseService.query(
        'UPDATE flavor_images SET is_cover = true WHERE flavor_id = ? AND id != ? LIMIT 1',
        [flavorId, imageId]
      );
    }

    // Delete the image
    await databaseService.query(
      'DELETE FROM flavor_images WHERE id = ? AND flavor_id = ?',
      [imageId, flavorId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
} 