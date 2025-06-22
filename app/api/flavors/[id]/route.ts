import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';

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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Flavor ID is required' },
        { status: 400 }
      );
    }

    // Get old stock for logging
    let oldStock = 0;
    if (data.log_history) {
      const [rows] = await databaseService.query('SELECT stock_quantity FROM flavors WHERE id = ?', [id]);
      if (Array.isArray(rows) && rows.length > 0) {
        oldStock = rows[0].stock_quantity;
      }
    }

    // Update the flavor with stock information
    await databaseService.query(
      `UPDATE flavors SET 
        stock_quantity = ?, 
        is_available = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        data.stock_quantity || 0,
        data.is_available ? 1 : 0,
        id
      ]
    );

    // Log stock change if requested
    if (data.log_history) {
      await databaseService.query(
        `INSERT INTO stock_history (item_id, item_type, old_quantity, new_quantity, change_amount, change_type, notes, changed_by) VALUES (?, 'flavor', ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.old_quantity ?? oldStock,
          data.stock_quantity || 0,
          data.change_amount || ((data.stock_quantity || 0) - (data.old_quantity ?? oldStock)),
          data.change_type || 'replacement',
          data.notes || '',
          data.changed_by || ''
        ]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Flavor stock updated successfully' 
    });
  } catch (error) {
    console.error('Error updating flavor stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update flavor stock' },
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