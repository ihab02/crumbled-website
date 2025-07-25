import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import databaseService from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
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

    // Get customer ID
    const [customerResult] = await databaseService.query<any[]>(
      'SELECT id FROM customers WHERE email = ?',
      [session.user.email]
    );

    if (!customerResult || customerResult.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customerId = customerResult[0].id;

    // If this is the default address, unset any existing default
    if (isDefault) {
      await databaseService.query(
        'UPDATE customer_addresses SET is_default = false WHERE customer_id = ?',
        [customerId]
      );
    }

    // Add new address
    const insertResult = await databaseService.query(
      'INSERT INTO customer_addresses (customer_id, city_id, zone_id, street_address, additional_info, is_default) VALUES (?, ?, ?, ?, ?, ?)',
      [customerId, cityId, zoneId, streetAddress, additionalInfo, isDefault || false]
    );

    return NextResponse.json({
      message: 'Address added successfully',
      addressId: (insertResult as any).insertId
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
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

    // Get customer ID
    const [customerResult] = await databaseService.query<any[]>(
      'SELECT id FROM customers WHERE email = ?',
      [session.user.email]
    );

    if (!customerResult || customerResult.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customerId = customerResult[0].id;

    // If this is the default address, unset any existing default
    if (isDefault) {
      await databaseService.query(
        'UPDATE customer_addresses SET is_default = false WHERE customer_id = ?',
        [customerId]
      );
    }

    // Update address
    await databaseService.query(
      'UPDATE customer_addresses SET city_id = ?, zone_id = ?, street_address = ?, additional_info = ?, is_default = ? WHERE id = ? AND customer_id = ?',
      [cityId, zoneId, streetAddress, additionalInfo, isDefault || false, addressId, customerId]
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
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

    // Get customer ID
    const [customerResult] = await databaseService.query<any[]>(
      'SELECT id FROM customers WHERE email = ?',
      [session.user.email]
    );

    if (!customerResult || customerResult.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customerId = customerResult[0].id;

    // Check if this is the last address
    const [addressCountResult] = await databaseService.query<any[]>(
      'SELECT COUNT(*) as count FROM customer_addresses WHERE customer_id = ?',
      [customerId]
    );

    const addressCount = addressCountResult[0]?.count || 0;

    if (addressCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last address. You must have at least one address.' },
        { status: 400 }
      );
    }

    // Delete address
    await databaseService.query(
      'DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [addressId, customerId]
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