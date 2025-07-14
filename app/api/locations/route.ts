import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Get all cities and all zones, including their active status
export async function GET() {
  try {
    // Get all cities (active and inactive)
    const [cities] = await db.query(
      'SELECT id, name, is_active FROM cities ORDER BY name'
    );

    // For each city, get all its zones (active and inactive)
    const citiesWithZones = await Promise.all(
      Array.isArray(cities) ? cities.map(async (city) => {
        const [zones] = await db.query(
          'SELECT id, name, delivery_fee, is_active FROM zones WHERE city_id = ? ORDER BY name',
          [city.id]
        );
        return {
          id: city.id,
          name: city.name,
          is_active: city.is_active,
          zones: Array.isArray(zones) ? zones.map(z => ({
            id: z.id,
            name: z.name,
            delivery_fee: parseFloat(z.delivery_fee) || 0,
            is_active: z.is_active
          })) : []
        };
      }) : []
    );

    return NextResponse.json({
      success: true,
      cities: citiesWithZones
    });
  } catch (error) {
    console.error('Get locations error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add a new city
export async function POST(request: Request) {
  try {
    const { name, zones } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'City name is required' },
        { status: 400 }
      );
    }

    // Insert city
    const [result] = await db.query(
      'INSERT INTO cities (name, is_active) VALUES (?, true)',
      [name]
    );

    const cityId = (result as any).insertId;

    // Insert zones if provided
    if (Array.isArray(zones) && zones.length > 0) {
      const zoneValues = zones.map((zone) => [
        cityId,
        zone.name,
        zone.delivery_fee || 0,
        true
      ]);

      await db.query(
        'INSERT INTO zones (city_id, name, delivery_fee, is_active) VALUES ?',
        [zoneValues]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'City added successfully',
      cityId
    });
  } catch (error) {
    console.error('Add city error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update city or zone status
export async function PUT(request: Request) {
  try {
    const { type, id, isActive } = await request.json();

    if (!type || !id || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const table = type === 'city' ? 'cities' : 'zones';
    await db.query(
      `UPDATE ${table} SET is_active = ? WHERE id = ?`,
      [isActive, id]
    );

    return NextResponse.json({
      success: true,
      message: `${type} status updated successfully`
    });
  } catch (error) {
    console.error('Update location status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add a new zone to a city
export async function PATCH(request: Request) {
  try {
    const { cityId, name, delivery_fee } = await request.json();

    if (!cityId || !name || typeof delivery_fee !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    await db.query(
      'INSERT INTO zones (city_id, name, delivery_fee, is_active) VALUES (?, ?, ?, true)',
      [cityId, name, delivery_fee]
    );

    return NextResponse.json({
      success: true,
      message: 'Zone added successfully'
    });
  } catch (error) {
    console.error('Add zone error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 