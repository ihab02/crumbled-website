import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    // Fetch all delivery personnel without authentication for testing
    const deliveryMen = await databaseService.query(`
      SELECT 
        id,
        name,
        id_number,
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

    console.log('Raw delivery men data:', deliveryMen);

    return NextResponse.json({
      success: true,
      count: Array.isArray(deliveryMen) ? deliveryMen.length : 0,
      data: deliveryMen
    });
  } catch (error) {
    console.error('Error fetching delivery men:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery personnel', details: error },
      { status: 500 }
    );
  }
} 