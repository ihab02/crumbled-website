import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { cityId, zoneId, streetAddress, additionalInfo, isDefault } = await request.json();

    // Validate required fields
    if (!cityId || !zoneId || !streetAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If this is the default address, unset any existing default
    if (isDefault) {
      await db.query(
        'UPDATE addresses SET is_default = false WHERE customer_id = ?',
        [(token as any).id]
      );
    }

    // Add new address
    const [result] = await db.query(
      'INSERT INTO addresses (customer_id, city_id, zone_id, street_address, additional_info, is_default) VALUES (?, ?, ?, ?, ?, ?)',
      [(token as any).id, cityId, zoneId, streetAddress, additionalInfo, isDefault || false]
    );

    return NextResponse.json({
      message: 'Address added successfully',
      addressId: (result as any).insertId
    });
  } catch (error) {
    console.error('Add address error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { addressId, cityId, zoneId, streetAddress, additionalInfo, isDefault } = await request.json();

    // Validate required fields
    if (!addressId || !cityId || !zoneId || !streetAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If this is the default address, unset any existing default
    if (isDefault) {
      await db.query(
        'UPDATE addresses SET is_default = false WHERE customer_id = ?',
        [(token as any).id]
      );
    }

    // Update address
    await db.query(
      'UPDATE addresses SET city_id = ?, zone_id = ?, street_address = ?, additional_info = ?, is_default = ? WHERE id = ? AND customer_id = ?',
      [cityId, zoneId, streetAddress, additionalInfo, isDefault || false, addressId, (token as any).id]
    );

    return NextResponse.json({
      message: 'Address updated successfully'
    });
  } catch (error) {
    console.error('Update address error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      );
    }

    // Delete address
    await db.query(
      'DELETE FROM addresses WHERE id = ? AND customer_id = ?',
      [addressId, (token as any).id]
    );

    return NextResponse.json({
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 