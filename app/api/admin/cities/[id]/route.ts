import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const city = await databaseService.query(
      'SELECT * FROM cities WHERE id = ?',
      [params.id]
    );

    if (!city || city.length === 0) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(city[0]);
  } catch (error) {
    console.error('Error fetching city:', error);
    return NextResponse.json(
      { error: 'Failed to fetch city' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, is_active } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'City name is required' },
        { status: 400 }
      );
    }

    await databaseService.query(
      'UPDATE cities SET name = ?, is_active = ? WHERE id = ?',
      [name, is_active, params.id]
    );

    const updatedCity = await databaseService.query(
      'SELECT * FROM cities WHERE id = ?',
      [params.id]
    );

    return NextResponse.json(updatedCity[0]);
  } catch (error) {
    console.error('Error updating city:', error);
    return NextResponse.json(
      { error: 'Failed to update city' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if city has associated zones
    const zones = await databaseService.query(
      'SELECT COUNT(*) as count FROM zones WHERE city_id = ?',
      [params.id]
    );

    if (zones[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete city with associated zones' },
        { status: 400 }
      );
    }

    await databaseService.query(
      'DELETE FROM cities WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({ message: 'City deleted successfully' });
  } catch (error) {
    console.error('Error deleting city:', error);
    return NextResponse.json(
      { error: 'Failed to delete city' },
      { status: 500 }
    );
  }
} 