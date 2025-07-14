import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { verifyJWT } from '@/lib/middleware/auth';

export async function GET() {
  try {
    // Use a single optimized query with LEFT JOINs to get all data at once
    const zones = await databaseService.query(`
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
      ORDER BY c.name ASC, z.name ASC
    `);
    
    return NextResponse.json(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token, 'admin');
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      city_id, 
      delivery_days = 0, 
      time_slot_id, 
      delivery_fee = 0.00, 
      is_active = true,
      kitchen_assignments = []
    } = await request.json();

    if (!name || !city_id) {
      return NextResponse.json(
        { error: 'Zone name and city are required' },
        { status: 400 }
      );
    }

    const result = await databaseService.transaction(async (connection) => {
      // Create the zone
      const [zoneResult] = await connection.execute(
        'INSERT INTO zones (name, city_id, delivery_days, time_slot_id, delivery_fee, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [name, city_id, delivery_days, time_slot_id, delivery_fee, is_active]
      );

      const zoneId = (zoneResult as any).insertId;

      // Create kitchen assignments if provided
      if (Array.isArray(kitchen_assignments) && kitchen_assignments.length > 0) {
        for (const assignment of kitchen_assignments) {
          const { kitchen_id, is_primary, priority } = assignment;
          
          await connection.execute(`
            INSERT INTO kitchen_zones (kitchen_id, zone_id, is_primary, priority, is_active)
            VALUES (?, ?, ?, ?, true)
          `, [kitchen_id, zoneId, is_primary, priority]);
        }
      }

      return zoneId;
    });

    // Fetch the newly created zone with all related data
    const newZone = await databaseService.query(`
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
    `, [result]);

    return NextResponse.json(newZone[0], { status: 201 });
  } catch (error) {
    console.error('Error creating zone:', error);
    return NextResponse.json(
      { error: 'Failed to create zone' },
      { status: 500 }
    );
  }
} 