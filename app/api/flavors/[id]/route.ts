import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import mysql from 'mysql2/promise';
import pool from '@/lib/db';

interface Flavor {
  id: number;
  name: string;
  description: string;
  mini_price: number;
  medium_price: number;
  large_price: number;
  is_active: boolean;
  images: Array<{
    id: number;
    image_url: string;
    is_cover: boolean;
  }>;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const flavorId = parseInt(params.id);
    
    if (isNaN(flavorId)) {
      return NextResponse.json(
        { success: false, error: "Invalid flavor ID" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Fetch flavor with review statistics
    const [flavors] = await connection.query(`
      SELECT 
        f.*,
        COALESCE(f.total_reviews, 0) as total_reviews,
        COALESCE(f.average_rating, 0.00) as average_rating,
        COALESCE(f.review_count_1_star, 0) as review_count_1_star,
        COALESCE(f.review_count_2_star, 0) as review_count_2_star,
        COALESCE(f.review_count_3_star, 0) as review_count_3_star,
        COALESCE(f.review_count_4_star, 0) as review_count_4_star,
        COALESCE(f.review_count_5_star, 0) as review_count_5_star
      FROM flavors f
      WHERE f.id = ? AND f.is_enabled = 1
    `, [flavorId]);

    if (flavors.length === 0) {
      return NextResponse.json(
        { success: false, error: "Flavor not found" },
        { status: 404 }
      );
    }

    const flavor = flavors[0];

    // Fetch flavor images
    const [images] = await connection.query(`
      SELECT id, image_url, is_cover, display_order
      FROM flavor_images 
      WHERE flavor_id = ?
      ORDER BY is_cover DESC, display_order ASC
    `, [flavorId]);

    // Format the response
    const formattedFlavor = {
      id: flavor.id,
      name: flavor.name,
      description: flavor.description,
      category: flavor.category,
      mini_price: parseFloat(flavor.mini_price),
      medium_price: parseFloat(flavor.medium_price),
      large_price: parseFloat(flavor.large_price),
      is_enabled: Boolean(flavor.is_enabled),
      created_at: flavor.created_at,
      updated_at: flavor.updated_at,
      total_reviews: flavor.total_reviews,
      average_rating: parseFloat(flavor.average_rating),
      review_count_1_star: flavor.review_count_1_star,
      review_count_2_star: flavor.review_count_2_star,
      review_count_3_star: flavor.review_count_3_star,
      review_count_4_star: flavor.review_count_4_star,
      review_count_5_star: flavor.review_count_5_star,
      images: images.map(img => ({
        id: img.id,
        image_url: img.image_url,
        is_cover: Boolean(img.is_cover),
        display_order: img.display_order
      }))
    };

    return NextResponse.json({
      success: true,
      flavor: formattedFlavor
    });
  } catch (error) {
    console.error("Error fetching flavor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch flavor" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await databaseService.query('DELETE FROM flavors WHERE id = ?', [id]);
    revalidatePath('/admin/flavors');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting flavor:', error);
    return NextResponse.json(
      { error: 'Failed to delete flavor' },
      { status: 500 }
    );
  }
} 