import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

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
  try {
    const flavor = await databaseService.query(
      `SELECT f.*, 
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', fi.id,
              'image_url', fi.image_url,
              'is_cover', fi.is_cover
            )
          ),
          JSON_ARRAY()
        ) as images
      FROM flavors f
      LEFT JOIN flavor_images fi ON f.id = fi.flavor_id
      WHERE f.id = ?
      GROUP BY f.id`,
      [params.id]
    );

    if (!flavor || flavor.length === 0) {
      return NextResponse.json(
        { error: 'Flavor not found' },
        { status: 404 }
      );
    }

    // The images field is already a JSON array from MySQL, no need to parse
    const flavorData = {
      ...flavor[0],
      images: flavor[0].images || []
    };

    return NextResponse.json(flavorData);
  } catch (error) {
    console.error('Error fetching flavor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flavor' },
      { status: 500 }
    );
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