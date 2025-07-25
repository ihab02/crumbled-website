import { NextResponse } from "next/server"
import { databaseService } from '@/lib/services/databaseService'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import pool from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Fallback sample data
const SAMPLE_FLAVORS = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Chocolate Chip",
    slug: "chocolate-chip",
    price: 3.99,
    original_price: null,
    description: "Classic chocolate chip cookies with semi-sweet chocolate chunks",
    image_url: "/placeholder.svg?height=300&width=300&text=Chocolate+Chip",
    category: "Classic",
    type: "regular",
    in_stock: true,
    rating: 4.8,
    reviews: 124,
    total_stock: 150,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Double Chocolate",
    slug: "double-chocolate",
    price: 4.29,
    original_price: null,
    description: "Rich chocolate cookies with chocolate chips",
    image_url: "/placeholder.svg?height=300&width=300&text=Double+Chocolate",
    category: "Premium",
    type: "regular",
    in_stock: true,
    rating: 4.9,
    reviews: 86,
    total_stock: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Oatmeal Raisin",
    slug: "oatmeal-raisin",
    price: 3.79,
    original_price: null,
    description: "Chewy oatmeal cookies with plump raisins",
    image_url: "/placeholder.svg?height=300&width=300&text=Oatmeal+Raisin",
    category: "Classic",
    type: "regular",
    in_stock: true,
    rating: 4.5,
    reviews: 68,
    total_stock: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "Peanut Butter",
    slug: "peanut-butter",
    price: 4.49,
    original_price: null,
    description: "Soft peanut butter cookies with a hint of salt",
    image_url: "/placeholder.svg?height=300&width=300&text=Peanut+Butter",
    category: "Premium",
    type: "regular",
    in_stock: true,
    rating: 4.7,
    reviews: 92,
    total_stock: 130,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    name: "Sugar Cookie",
    slug: "sugar-cookie",
    price: 3.49,
    original_price: null,
    description: "Sweet and simple sugar cookies with a soft texture",
    image_url: "/placeholder.svg?height=300&width=300&text=Sugar+Cookie",
    category: "Classic",
    type: "regular",
    in_stock: true,
    rating: 4.6,
    reviews: 75,
    total_stock: 140,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    name: "Snickerdoodle",
    slug: "snickerdoodle",
    price: 3.89,
    original_price: null,
    description: "Cinnamon sugar cookies with a chewy center",
    image_url: "/placeholder.svg?height=300&width=300&text=Snickerdoodle",
    category: "Classic",
    type: "regular",
    in_stock: true,
    rating: 4.7,
    reviews: 89,
    total_stock: 110,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

interface Flavor {
  id: number;
  name: string;
  description: string;
  mini_price: number;
  medium_price: number;
  large_price: number;
  image_url: string;
  is_active: boolean;
  display_order: number;
}

interface InsertResult {
  insertId: number;
}

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function GET() {
  try {
    // Get user session to check for favorites
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Get flavors with their images and review statistics
    const [flavors] = await pool.query(`
      SELECT 
        f.*,
        fi.id as image_id,
        fi.image_url,
        fi.is_cover,
        fi.display_order,
        COALESCE(f.total_reviews, 0) as total_reviews,
        COALESCE(f.average_rating, 0.00) as average_rating,
        CASE WHEN uf.flavor_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM flavors f
      LEFT JOIN flavor_images fi ON f.id = fi.flavor_id
      LEFT JOIN user_favorites uf ON f.id = uf.flavor_id AND uf.user_id = ?
      WHERE f.is_active = 1 AND f.is_enabled = 1 AND f.deleted_at IS NULL
      ORDER BY is_favorite DESC, f.created_at DESC, fi.display_order
    `, [userId || 0]);

    // Group flavors and their images
    const flavorMap = new Map();
    
    // Convert single object to array if needed
    const flavorsArray = Array.isArray(flavors) ? flavors : [flavors];
    
    flavorsArray.forEach((row: any) => {
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
          stock_quantity: parseInt(row.stock_quantity) || 0,
          stock_quantity_mini: parseInt(row.stock_quantity_mini) || 0,
          stock_quantity_medium: parseInt(row.stock_quantity_medium) || 0,
          stock_quantity_large: parseInt(row.stock_quantity_large) || 0,
          is_available: Boolean(row.is_available),
          is_active: Boolean(row.is_active),
          created_at: row.created_at,
          updated_at: row.updated_at,
          total_reviews: parseInt(row.total_reviews) || 0,
          average_rating: parseFloat(row.average_rating) || 0,
          is_favorite: Boolean(row.is_favorite),
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

    const processedFlavors = Array.from(flavorMap.values()).map(flavor => {
      // Find cover image or use first image
      const coverImage = flavor.images.find((img: any) => img.is_cover) || flavor.images[0];
      
      return {
        ...flavor,
        image_url: coverImage?.image_url || '/images/placeholder.png'
      };
    });

    return NextResponse.json({ success: true, data: processedFlavors });
  } catch (error) {
    console.error('Error fetching flavors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flavors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const miniPrice = formData.get('miniPrice') as string
    const mediumPrice = formData.get('mediumPrice') as string
    const largePrice = formData.get('largePrice') as string
    const enabled = formData.get('enabled') === 'true'
    const images = formData.getAll('images') as File[]
    const coverImageIndex = formData.get('coverImageIndex') as string

    // Calculate total request size
    const totalSize = images.reduce((total, image) => total + image.size, 0);
    const maxTotalSize = 50 * 1024 * 1024; // 50MB total
    
    if (totalSize > maxTotalSize) {
      return NextResponse.json(
        { error: `Total request size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 50MB` },
        { status: 413 }
      );
    }

    // Validate image file sizes and types
    const maxFileSize = 10 * 1024 * 1024; // 10MB per file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // Check file type
      if (!allowedTypes.includes(image.type)) {
        return NextResponse.json(
          { error: `Invalid file type for image ${i + 1}. Allowed types: JPEG, PNG, GIF, WebP` },
          { status: 400 }
        );
      }
      
      // Check file size
      if (image.size > maxFileSize) {
        return NextResponse.json(
          { error: `Image ${i + 1} is too large. Maximum size is 10MB per image` },
          { status: 400 }
        );
      }
    }

    // Generate slug from name
    const slug = generateSlug(name)

    // Insert the flavor first with review statistics initialized
    const result = await databaseService.query(
      `INSERT INTO flavors (
        name, description, mini_price, medium_price, large_price, 
        is_active, slug, category,
        total_reviews, average_rating,
        review_count_1_star, review_count_2_star, review_count_3_star, 
        review_count_4_star, review_count_5_star
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0.00, 0, 0, 0, 0, 0)`,
      [name, description, miniPrice, mediumPrice, largePrice, enabled, slug, 'Classic']
    )

    const flavorId = result.insertId

    // Handle image uploads
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      const isCover = i === parseInt(coverImageIndex)
      
      // Generate a unique filename
      const timestamp = Date.now()
      const uniqueFilename = `${timestamp}-${image.name}`
      
      // Save the file to the filesystem
      const bytes = await image.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'flavors')
      const filePath = join(uploadDir, uniqueFilename)
      await writeFile(filePath, buffer)
      
      // Store the relative URL in the database
      const imageUrl = `/uploads/flavors/${uniqueFilename}`
      
      await databaseService.query(
        'INSERT INTO flavor_images (flavor_id, image_url, is_cover) VALUES (?, ?, ?)',
        [flavorId, imageUrl, isCover]
      )
    }

    return NextResponse.json({ success: true, id: flavorId })
  } catch (error) {
    console.error('Error creating flavor:', error)
    return NextResponse.json(
      { error: 'Failed to create flavor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Flavor ID is required" }, { status: 400 })
    }

    const flavorData = await request.json()

    // Update the flavor
    await databaseService.query(
      'UPDATE flavors SET name = ?, description = ?, mini_price = ?, medium_price = ?, large_price = ?, is_active = ? WHERE id = ?',
      [
        flavorData.name,
        flavorData.description,
        flavorData.mini_price,
        flavorData.medium_price,
        flavorData.large_price,
        flavorData.is_active,
        id
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating flavor:', error)
    return NextResponse.json(
      { error: 'Failed to update flavor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Flavor ID is required" }, { status: 400 })
    }

    await databaseService.query('DELETE FROM flavors WHERE id = ?', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting flavor:', error)
    return NextResponse.json(
      { error: 'Failed to delete flavor' },
      { status: 500 }
    )
  }
}
