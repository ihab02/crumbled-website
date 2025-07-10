import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { ViewService } from '@/lib/services/viewService';
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

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let decoded;
    try {
      decoded = verifyJWT(adminToken, 'admin');
    } catch (error) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get show_deleted parameter from URL
    const { searchParams } = new URL(request.url);
    const showDeleted = searchParams.get('show_deleted') === 'true';

    // Get admin user ID from token
    const adminUserId = decoded.userId;

    // Update admin view preferences
    await ViewService.updateAdminViewPreferences(adminUserId, 'flavors', showDeleted);

    // Get flavors using ViewService
    const flavors = await ViewService.getFlavors(showDeleted);

    // Get images and stock information for all flavors
    const flavorIds = flavors.map(f => f.id);
    let images = [];
    let stockData = [];

    if (flavorIds.length > 0) {
      // Get images
      const imagesQuery = `
        SELECT 
          fi.id as image_id,
          fi.flavor_id,
          fi.image_url,
          fi.is_cover,
          fi.display_order
        FROM flavor_images fi
        WHERE fi.flavor_id IN (${flavorIds.map(() => '?').join(',')})
        ORDER BY fi.flavor_id, fi.display_order
      `;
      images = await databaseService.query(imagesQuery, flavorIds);

      // Get stock data
      const stockQuery = `
        SELECT 
          id as flavor_id,
          stock_quantity_mini,
          stock_quantity_medium,
          stock_quantity_large
        FROM flavors
        WHERE id IN (${flavorIds.map(() => '?').join(',')})
      `;
      stockData = await databaseService.query(stockQuery, flavorIds);
    }

    // Group images by flavor_id
    const imagesMap = new Map();
    images.forEach(img => {
      if (!imagesMap.has(img.flavor_id)) {
        imagesMap.set(img.flavor_id, []);
      }
      imagesMap.get(img.flavor_id).push({
        id: img.image_id,
        image_url: img.image_url,
        is_cover: Boolean(img.is_cover),
        display_order: img.display_order
      });
    });

    // Create stock map
    const stockMap = new Map();
    stockData.forEach(stock => {
      stockMap.set(stock.flavor_id, {
        mini: { 
          quantity: parseInt(stock.stock_quantity_mini) || 0, 
          min_threshold: 10, 
          max_capacity: 100, 
          status: 'unknown' 
        },
        medium: { 
          quantity: parseInt(stock.stock_quantity_medium) || 0, 
          min_threshold: 10, 
          max_capacity: 100, 
          status: 'unknown' 
        },
        large: { 
          quantity: parseInt(stock.stock_quantity_large) || 0, 
          min_threshold: 10, 
          max_capacity: 100, 
          status: 'unknown' 
        }
      });
    });

    // Process flavors with images and stock
    const processedFlavors = flavors.map(flavor => {
      const flavorImages = imagesMap.get(flavor.id) || [];
      const flavorStock = stockMap.get(flavor.id) || {
        mini: { quantity: 0, min_threshold: 10, max_capacity: 100, status: 'unknown' },
        medium: { quantity: 0, min_threshold: 10, max_capacity: 100, status: 'unknown' },
        large: { quantity: 0, min_threshold: 10, max_capacity: 100, status: 'unknown' }
      };

      // Process stock status for each size
      ['mini', 'medium', 'large'].forEach(size => {
        const stock = flavorStock[size];
        
        if (stock.quantity <= 0) {
          stock.status = 'out_of_stock';
        } else if (stock.quantity <= stock.min_threshold) {
          stock.status = 'low_stock';
        } else if (stock.quantity >= stock.max_capacity * 0.9) {
          stock.status = 'high_stock';
        } else {
          stock.status = 'in_stock';
        }
      });

      return {
        id: flavor.id,
        name: flavor.name,
        description: flavor.description,
        mini_price: parseFloat(flavor.mini_price) || 0,
        medium_price: parseFloat(flavor.medium_price) || 0,
        large_price: parseFloat(flavor.large_price) || 0,
        is_active: Boolean(flavor.is_enabled),
        category: flavor.category,
        created_at: flavor.created_at,
        updated_at: flavor.updated_at,
        deleted_at: flavor.deleted_at,
        status: flavor.status,
        images: flavorImages,
        stock: flavorStock
      };
    });

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
    const category = formData.get('category') as string || 'Classic';
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
      [name, description, miniPrice, mediumPrice, largePrice, enabled, slug, category]
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