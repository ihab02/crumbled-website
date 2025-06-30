import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    // First, let's try a simpler query to get zones with city names and city active status
    const zones = await databaseService.query(`
      SELECT 
        z.*,
        c.name as city_name,
        c.is_active as city_is_active
      FROM zones z
      LEFT JOIN cities c ON z.city_id = c.id
      ORDER BY c.name ASC, z.name ASC
    `);
    
    // Now let's try to get time slot information separately to avoid JOIN issues
    const zonesWithTimeSlots = await Promise.all(
      zones.map(async (zone: any) => {
        if (zone.time_slot_id) {
          try {
            const timeSlot = await databaseService.query(
              'SELECT name, from_hour, to_hour FROM delivery_time_slots WHERE id = ?',
              [zone.time_slot_id]
            );
            if (timeSlot.length > 0) {
              return {
                ...zone,
                time_slot_name: timeSlot[0].name,
                time_slot_from: timeSlot[0].from_hour,
                time_slot_to: timeSlot[0].to_hour
              };
            }
          } catch (error) {
            console.error(`Error fetching time slot ${zone.time_slot_id}:`, error);
          }
        }
        return {
          ...zone,
          time_slot_name: null,
          time_slot_from: null,
          time_slot_to: null
        };
      })
    );
    
    return NextResponse.json(zonesWithTimeSlots);
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
    const { 
      name, 
      city_id, 
      delivery_days = 0, 
      time_slot_id, 
      delivery_fee = 0.00, 
      is_active = true 
    } = await request.json();

    if (!name || !city_id) {
      return NextResponse.json(
        { error: 'Zone name and city are required' },
        { status: 400 }
      );
    }

    const result = await databaseService.query(
      'INSERT INTO zones (name, city_id, delivery_days, time_slot_id, delivery_fee, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [name, city_id, delivery_days, time_slot_id, delivery_fee, is_active]
    );

    // Fetch the newly created zone with city name
    const newZone = await databaseService.query(`
      SELECT 
        z.*,
        c.name as city_name,
        c.is_active as city_is_active
      FROM zones z
      LEFT JOIN cities c ON z.city_id = c.id
      WHERE z.id = ?
    `, [result.insertId]);

    // Add time slot information if available
    let zoneWithTimeSlot = newZone[0];
    if (zoneWithTimeSlot.time_slot_id) {
      try {
        const timeSlot = await databaseService.query(
          'SELECT name, from_hour, to_hour FROM delivery_time_slots WHERE id = ?',
          [zoneWithTimeSlot.time_slot_id]
        );
        if (timeSlot.length > 0) {
          zoneWithTimeSlot = {
            ...zoneWithTimeSlot,
            time_slot_name: timeSlot[0].name,
            time_slot_from: timeSlot[0].from_hour,
            time_slot_to: timeSlot[0].to_hour
          };
        }
      } catch (error) {
        console.error(`Error fetching time slot ${zoneWithTimeSlot.time_slot_id}:`, error);
      }
    }

    return NextResponse.json(zoneWithTimeSlot, { status: 201 });
  } catch (error) {
    console.error('Error creating zone:', error);
    return NextResponse.json(
      { error: 'Failed to create zone' },
      { status: 500 }
    );
  }
} 