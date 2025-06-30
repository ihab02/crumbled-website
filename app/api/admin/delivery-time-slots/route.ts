import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    const timeSlots = await databaseService.query(`
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
      ORDER BY from_hour ASC
    `);

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error('Error fetching delivery time slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery time slots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      from_hour,
      to_hour,
      available_days,
      notes
    } = body;

    // Validate required fields
    if (!name || !from_hour || !to_hour || !available_days) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await databaseService.query(`
      INSERT INTO delivery_time_slots (
        name, from_hour, to_hour, available_days, notes
      ) VALUES (?, ?, ?, ?, ?)
    `, [name, from_hour, to_hour, JSON.stringify(available_days), notes]);

    return NextResponse.json({ 
      message: 'Delivery time slot created successfully',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating delivery time slot:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery time slot' },
      { status: 500 }
    );
  }
} 