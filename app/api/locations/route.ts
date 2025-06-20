import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Get all active cities
export async function GET() {
  try {
    // Get all active cities
    const [cities] = await db.query(
      'SELECT id, name FROM cities WHERE is_active = true ORDER BY name'
    );

    // For each city, get its active zones
    const citiesWithZones = await Promise.all(
      Array.isArray(cities) ? cities.map(async (city) => {
        const [zones] = await db.query(
          'SELECT id, name, delivery_fee FROM zones WHERE city_id = ? AND is_active = true ORDER BY name',
          [city.id]
        );
        return {
          id: city.id,
          name: city.name,
          zones: Array.isArray(zones) ? zones : []
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
    const { cityId, name, deliveryFee } = await request.json();

    if (!cityId || !name || typeof deliveryFee !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    await db.query(
      'INSERT INTO zones (city_id, name, delivery_fee, is_active) VALUES (?, ?, ?, true)',
      [cityId, name, deliveryFee]
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