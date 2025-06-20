import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { revalidatePath } from 'next/cache';

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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    console.log('Updating flavor:', { id, data });

    // If only updating is_active status
    if (Object.keys(data).length === 1 && 'is_active' in data) {
      console.log('Updating is_active status:', { id, is_active: data.is_active });
      
      // Update the active status
      const updateResult = await databaseService.query(
        'UPDATE flavors SET is_active = ? WHERE id = ?',
        [data.is_active ? 1 : 0, id]
      );
      console.log('Update result:', updateResult);

      // Fetch the updated flavor to verify
      const [updatedFlavor] = await databaseService.query(
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
        [id]
      );
      console.log('Updated flavor:', updatedFlavor);

      if (!updatedFlavor) {
        return NextResponse.json(
          { error: 'Flavor not found' },
          { status: 404 }
        );
      }

      revalidatePath('/admin/flavors');
      return NextResponse.json({
        ...updatedFlavor,
        is_enabled: updatedFlavor.is_active === 1,
        images: updatedFlavor.images || []
      });
    }

    // For full updates, ensure we have all required fields
    const { name, description, mini_price, medium_price, large_price, is_active } = data;

    if (!name || !description || mini_price === undefined || medium_price === undefined || large_price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update the flavor
    const updateResult = await databaseService.query(
      'UPDATE flavors SET name = ?, description = ?, mini_price = ?, medium_price = ?, large_price = ?, is_active = ? WHERE id = ?',
      [name, description, mini_price, medium_price, large_price, is_active ? 1 : 0, id]
    );
    console.log('Update result:', updateResult);

    // Fetch the updated flavor
    const [updatedFlavor] = await databaseService.query(
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
      [id]
    );
    console.log('Updated flavor:', updatedFlavor);

    if (!updatedFlavor) {
      return NextResponse.json(
        { error: 'Flavor not found' },
        { status: 404 }
      );
    }

    revalidatePath('/admin/flavors');
    return NextResponse.json({
      ...updatedFlavor,
      is_enabled: updatedFlavor.is_active === 1,
      images: updatedFlavor.images || []
    });
  } catch (error) {
    console.error('Error updating flavor:', error);
    return NextResponse.json(
      { error: 'Failed to update flavor' },
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