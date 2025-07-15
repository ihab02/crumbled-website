import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { verifyJWT } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Delivery men API called');
    console.log('Cookies:', request.cookies.getAll());
    
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value
    console.log('Admin token found:', !!token);
    
    if (!token) {
      console.log('No admin token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    console.log('Token decoded:', decoded);
    
    if (!decoded || decoded.type !== 'admin') {
      console.log('Invalid token or not admin type');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all delivery personnel (both active and inactive for debugging)
    const allDeliveryMen = await databaseService.query(`
      SELECT 
        id,
        name,
        id_number,
        mobile_phone,
        available_from_hour,
        available_to_hour,
        available_days,
        notes,
        is_active
      FROM delivery_men 
      ORDER BY name ASC
    `);

    console.log('All delivery men:', allDeliveryMen);

    // Filter to only active delivery personnel (handle both boolean and integer)
    const deliveryMen = allDeliveryMen.filter((dm: any) => dm.is_active === 1 || dm.is_active === true);

    console.log('Active delivery men:', deliveryMen);

    return NextResponse.json({
      success: true,
      data: deliveryMen
    });
  } catch (error) {
    console.error('Error fetching delivery men:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery personnel' },
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