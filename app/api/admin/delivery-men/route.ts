import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    const deliveryMen = await databaseService.query(`
      SELECT 
        id,
        name,
        id_number,
        home_address,
        mobile_phone,
        available_from_hour,
        available_to_hour,
        available_days,
        notes,
        is_active,
        created_at,
        updated_at
      FROM delivery_men
      ORDER BY name ASC
    `);

    return NextResponse.json(deliveryMen);
  } catch (error) {
    console.error('Error fetching delivery men:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery men' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      id_number,
      home_address,
      mobile_phone,
      available_from_hour,
      available_to_hour,
      available_days,
      notes
    } = body;

    // Validate required fields
    if (!name || !id_number || !home_address || !mobile_phone || !available_from_hour || !available_to_hour || !available_days) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await databaseService.query(`
      INSERT INTO delivery_men (
        name, id_number, home_address, mobile_phone, 
        available_from_hour, available_to_hour, available_days, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, id_number, home_address, mobile_phone, available_from_hour, available_to_hour, JSON.stringify(available_days), notes]);

    return NextResponse.json({ 
      message: 'Delivery man created successfully',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating delivery man:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery man' },
      { status: 500 }
    );
  }
} 