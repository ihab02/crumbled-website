import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { verifyJWT } from '@/lib/middleware/auth';

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
      const decoded = verifyJWT(adminToken, 'admin');
    } catch (error) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get flavors with their images and stock information
    const flavors = await databaseService.query(`
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

    // Group flavors and their images and stock
    const flavorMap = new Map();
    
    // Ensure flavors is always an array
    const flavorsArray = Array.isArray(flavors) ? flavors : (flavors ? [flavors] : []);
    
    console.log('Raw flavors data:', flavorsArray.length, 'rows');
    
    flavorsArray.forEach(row => {
      if (!flavorMap.has(row.id)) {
        flavorMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          mini_price: parseFloat(row.mini_price) || 0,
          medium_price: parseFloat(row.medium_price) || 0,
          large_price: parseFloat(row.large_price) || 0,
          is_active: Boolean(row.is_enabled),
          created_at: row.created_at,
          updated_at: row.updated_at,
          images: [],
          stock: {
            mini: { 
              quantity: parseInt(row.stock_quantity_mini) || 0, 
              min_threshold: 10, 
              max_capacity: 100, 
              status: 'unknown' 
            },
            medium: { 
              quantity: parseInt(row.stock_quantity_medium) || 0, 
              min_threshold: 10, 
              max_capacity: 100, 
              status: 'unknown' 
            },
            large: { 
              quantity: parseInt(row.stock_quantity_large) || 0, 
              min_threshold: 10, 
              max_capacity: 100, 
              status: 'unknown' 
            }
          }
        });
      }
      
      const flavor = flavorMap.get(row.id);
      
      // Add image if it exists
      if (row.image_id) {
        flavor.images.push({
          id: row.image_id,
          image_url: row.image_url,
          is_cover: Boolean(row.is_cover),
          display_order: row.display_order
        });
      }
    });

    // Process stock status for each flavor
    flavorMap.forEach(flavor => {
      // Determine stock status for each size
      ['mini', 'medium', 'large'].forEach(size => {
        const stock = flavor.stock[size];
        
        if (stock.quantity <= 0) {
          stock.status = 'out_of_stock';
        } else if (stock.quantity <= stock.min_threshold) {
          stock.status = 'low_stock';
        } else if (stock.quantity >= stock.max_capacity * 0.9) {
          stock.status = 'high_stock';
        } else {
          stock.status = 'in_stock';
        }
        
        console.log(`Set stock for ${flavor.name} - ${size}:`, stock);
      });
    });

    const processedFlavors = Array.from(flavorMap.values());
    
    console.log('Processed flavors:', processedFlavors.map(f => ({
      name: f.name,
      stock: f.stock
    })));

    return NextResponse.json(processedFlavors);
  } catch (error) {
    console.error('Error fetching flavors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flavors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
      const decoded = verifyJWT(adminToken, 'admin');
    } catch (error) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const miniPrice = formData.get('miniPrice') as string;
    const mediumPrice = formData.get('mediumPrice') as string;
    const largePrice = formData.get('largePrice') as string;
    const enabled = formData.get('enabled') === 'true';
    const images = formData.getAll('images') as File[];
    const coverImageIndexStr = formData.get('coverImageIndex') as string;
    const coverImageIndex = coverImageIndexStr ? parseInt(coverImageIndexStr) : 0;

    // Generate slug from name
    const slug = generateSlug(name);

    // Validate required fields
    if (!name || !description || !miniPrice || !mediumPrice || !largePrice) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate images
    if (images.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      );
    }

    // Validate cover image index
    if (coverImageIndex < 0 || coverImageIndex >= images.length) {
      return NextResponse.json(
        { error: 'Invalid cover image index' },
        { status: 400 }
      );
    }

    console.log('Creating flavor:', { name, description, miniPrice, mediumPrice, largePrice, enabled, imagesCount: images.length, coverImageIndex, slug });

    // Insert the flavor first
    const result = await databaseService.query(
      'INSERT INTO flavors (name, description, mini_price, medium_price, large_price, is_enabled, slug, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, miniPrice, mediumPrice, largePrice, enabled, slug, 'Classic']
    ) as any;

    const flavorId = result.insertId;
    console.log('Flavor created with ID:', flavorId);

    // Handle image uploads
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const isCover = i === coverImageIndex;
      
      console.log(`Processing image ${i + 1}/${images.length}:`, { name: image.name, isCover });
      
      // Generate a unique filename
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${image.name}`;
      
      // Save the file to the filesystem
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'flavors');
      await mkdir(uploadDir, { recursive: true });
      const filePath = join(uploadDir, uniqueFilename);
      await writeFile(filePath, buffer);
      
      // Store the relative URL in the database
      const imageUrl = `/uploads/flavors/${uniqueFilename}`;
      
      await databaseService.query(
        'INSERT INTO flavor_images (flavor_id, image_url, is_cover) VALUES (?, ?, ?)',
        [flavorId, imageUrl, isCover]
      );
      
      console.log(`Image ${i + 1} saved:`, { imageUrl, isCover });
    }

    return NextResponse.json({ success: true, id: flavorId });
  } catch (error) {
    console.error('Error creating flavor:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create flavor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 