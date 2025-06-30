import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const zone = await databaseService.query(`
      SELECT 
        z.*,
        c.name as city_name,
        c.is_active as city_is_active
      FROM zones z
      LEFT JOIN cities c ON z.city_id = c.id
      WHERE z.id = ?
    `, [params.id]);

    if (!zone || zone.length === 0) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    // Add time slot information if available
    let zoneWithTimeSlot = zone[0];
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

    return NextResponse.json(zoneWithTimeSlot);
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
    const { 
      name, 
      city_id, 
      delivery_days, 
      time_slot_id, 
      delivery_fee, 
      is_active 
    } = await request.json();

    if (!name || !city_id) {
      return NextResponse.json(
        { error: 'Zone name and city are required' },
        { status: 400 }
      );
    }

    await databaseService.query(
      'UPDATE zones SET name = ?, city_id = ?, delivery_days = ?, time_slot_id = ?, delivery_fee = ?, is_active = ? WHERE id = ?',
      [name, city_id, delivery_days, time_slot_id, delivery_fee, is_active, params.id]
    );

    const updatedZone = await databaseService.query(`
      SELECT 
        z.*,
        c.name as city_name,
        c.is_active as city_is_active
      FROM zones z
      LEFT JOIN cities c ON z.city_id = c.id
      WHERE z.id = ?
    `, [params.id]);

    // Add time slot information if available
    let zoneWithTimeSlot = updatedZone[0];
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

    return NextResponse.json(zoneWithTimeSlot);
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
    await databaseService.query(
      'DELETE FROM zones WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({ message: 'Zone deleted successfully' });
  } catch (error) {
    console.error('Error deleting zone:', error);
    return NextResponse.json(
      { error: 'Failed to delete zone' },
      { status: 500 }
    );
  }
} 