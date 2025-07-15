import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { verifyJWT } from '@/lib/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const zone = await databaseService.query(`
      SELECT 
        z.*,
        c.name as city_name,
        c.is_active as city_is_active,
        dts.name as time_slot_name,
        dts.from_hour as time_slot_from,
        dts.to_hour as time_slot_to
      FROM zones z
      LEFT JOIN cities c ON z.city_id = c.id
      LEFT JOIN delivery_time_slots dts ON z.time_slot_id = dts.id
      WHERE z.id = ?
    `, [params.id]);

    if (!zone || zone.length === 0) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(zone[0]);
  } catch (error) {
    console.error('Error fetching zone:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zone' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyJWT(token, 'admin');
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      city_id, 
      delivery_days, 
      time_slot_id, 
      delivery_fee, 
      is_active,
      kitchen_assignments = []
    } = await request.json();

    if (!name || !city_id) {
      return NextResponse.json(
        { error: 'Zone name and city are required' },
        { status: 400 }
      );
    }

    await databaseService.transaction(async (connection) => {
      // Update the zone
      await connection.execute(
        'UPDATE zones SET name = ?, city_id = ?, delivery_days = ?, time_slot_id = ?, delivery_fee = ?, is_active = ? WHERE id = ?',
        [name, city_id, delivery_days, time_slot_id, delivery_fee, is_active, params.id]
      );

      // Update kitchen assignments if provided
      if (Array.isArray(kitchen_assignments)) {
        // First, deactivate all existing assignments for this zone
        await connection.execute(`
          UPDATE kitchen_zones 
          SET is_active = false 
          WHERE zone_id = ?
        `, [params.id]);

        // Then, insert or update the new assignments
        for (const assignment of kitchen_assignments) {
          const { kitchen_id, is_primary, priority } = assignment;
          
          await connection.execute(`
            INSERT INTO kitchen_zones (kitchen_id, zone_id, is_primary, priority, is_active)
            VALUES (?, ?, ?, ?, true)
            ON DUPLICATE KEY UPDATE 
              is_primary = VALUES(is_primary),
              priority = VALUES(priority),
              is_active = true
          `, [kitchen_id, params.id, is_primary, priority]);
        }
      }
    });

    const updatedZone = await databaseService.query(`
      SELECT 
        z.*,
        c.name as city_name,
        c.is_active as city_is_active,
        dts.name as time_slot_name,
        dts.from_hour as time_slot_from,
        dts.to_hour as time_slot_to
      FROM zones z
      LEFT JOIN cities c ON z.city_id = c.id
      LEFT JOIN delivery_time_slots dts ON z.time_slot_id = dts.id
      WHERE z.id = ?
    `, [params.id]);

    return NextResponse.json(updatedZone[0]);
  } catch (error) {
    console.error('Error updating zone:', error);
    return NextResponse.json(
      { error: 'Failed to update zone' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyJWT(token, 'admin');
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await databaseService.transaction(async (connection) => {
      // Delete kitchen assignments first
      await connection.execute(
        'DELETE FROM kitchen_zones WHERE zone_id = ?',
        [params.id]
      );

      // Then delete the zone
      await connection.execute(
        'DELETE FROM zones WHERE id = ?',
        [params.id]
      );
    });

    return NextResponse.json({ message: 'Zone deleted successfully' });
  } catch (error) {
    console.error('Error deleting zone:', error);
    return NextResponse.json(
      { error: 'Failed to delete zone' },
      { status: 500 }
    );
  }
} 