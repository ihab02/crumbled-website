import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deliveryMan = await databaseService.query(`
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
      WHERE id = ?
    `, [params.id]);

    if (!deliveryMan || deliveryMan.length === 0) {
      return NextResponse.json(
        { error: 'Delivery man not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(deliveryMan[0]);
  } catch (error) {
    console.error('Error fetching delivery man:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery man' },
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
      id_number,
      home_address,
      mobile_phone,
      available_from_hour,
      available_to_hour,
      available_days,
      notes,
      is_active
    } = body;

    // Validate required fields
    if (!name || !id_number || !home_address || !mobile_phone || !available_from_hour || !available_to_hour || !available_days) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await databaseService.query(`
      UPDATE delivery_men SET
        name = ?,
        id_number = ?,
        home_address = ?,
        mobile_phone = ?,
        available_from_hour = ?,
        available_to_hour = ?,
        available_days = ?,
        notes = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, id_number, home_address, mobile_phone, available_from_hour, available_to_hour, JSON.stringify(available_days), notes, is_active, params.id]);

    return NextResponse.json({ 
      message: 'Delivery man updated successfully' 
    });
  } catch (error) {
    console.error('Error updating delivery man:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery man' },
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
      DELETE FROM delivery_men WHERE id = ?
    `, [params.id]);

    return NextResponse.json({ 
      message: 'Delivery man deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting delivery man:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery man' },
      { status: 500 }
    );
  }
} 