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

export async function GET() {
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

    // Get flavors with their images
    const [flavors] = await databaseService.query(`
      SELECT 
        f.*,
        fi.id as image_id,
        fi.image_url,
        fi.is_cover,
        fi.display_order
      FROM flavors f
      LEFT JOIN flavor_images fi ON f.id = fi.flavor_id
      ORDER BY f.created_at DESC, fi.display_order
    `);

    // Group flavors and their images
    const flavorMap = new Map();
    
    // Convert single object to array if needed
    const flavorsArray = Array.isArray(flavors) ? flavors : [flavors];
    
    flavorsArray.forEach(row => {
      if (!flavorMap.has(row.id)) {
        flavorMap.set(row.id, {
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          category: row.category,
          mini_price: parseFloat(row.mini_price) || 0,
          medium_price: parseFloat(row.medium_price) || 0,
          large_price: parseFloat(row.large_price) || 0,
          is_active: Boolean(row.is_active),
          created_at: row.created_at,
          updated_at: row.updated_at,
          images: []
        });
      }
      
      if (row.image_id) {
        const flavor = flavorMap.get(row.id);
        flavor.images.push({
          id: row.image_id,
          image_url: row.image_url,
          is_cover: Boolean(row.is_cover),
          display_order: row.display_order
        });
      }
    });

    const processedFlavors = Array.from(flavorMap.values());

    return NextResponse.json(processedFlavors);
  } catch (error) {
    console.error('Error fetching flavors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flavors' },
      { status: 500 }
    );
  }
} 