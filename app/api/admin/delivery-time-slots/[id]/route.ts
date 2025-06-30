import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timeSlot = await databaseService.query(`
      SELECT 
        id,
        name,
        from_hour,
        to_hour,
        available_days,
        notes,
        is_active,
        created_at,
        updated_at
      FROM delivery_time_slots
      WHERE id = ?
    `, [params.id]);

    if (!timeSlot || timeSlot.length === 0) {
      return NextResponse.json(
        { error: 'Delivery time slot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(timeSlot[0]);
  } catch (error) {
    console.error('Error fetching delivery time slot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery time slot' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      from_hour,
      to_hour,
      available_days,
      notes,
      is_active
    } = body;

    // Validate required fields
    if (!name || !from_hour || !to_hour || !available_days) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await databaseService.query(`
      UPDATE delivery_time_slots SET
        name = ?,
        from_hour = ?,
        to_hour = ?,
        available_days = ?,
        notes = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, from_hour, to_hour, JSON.stringify(available_days), notes, is_active, params.id]);

    return NextResponse.json({ 
      message: 'Delivery time slot updated successfully' 
    });
  } catch (error) {
    console.error('Error updating delivery time slot:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery time slot' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await databaseService.query(`
      DELETE FROM delivery_time_slots WHERE id = ?
    `, [params.id]);

    return NextResponse.json({ 
      message: 'Delivery time slot deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting delivery time slot:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery time slot' },
      { status: 500 }
    );
  }
} 