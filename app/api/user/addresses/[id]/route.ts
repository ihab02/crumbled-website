import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { databaseService } from '@/lib/services/databaseService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addressId = parseInt(params.id)
    
    if (isNaN(addressId)) {
      return NextResponse.json({ error: 'Invalid address ID' }, { status: 400 })
    }

    const db = databaseService
    
    // Get user ID
    const userResult = await db.query(
      'SELECT id FROM customers WHERE email = ?',
      [session.user.email]
    )

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userResult[0].id

    // Get address details
    const addressResult = await db.query(
      `SELECT 
        ca.id,
        ca.street_address,
        ca.additional_info,
        ca.city_id,
        ca.zone_id,
        ca.is_default,
        c.name as city_name,
        z.name as zone_name,
        z.delivery_fee
       FROM customer_addresses ca
       LEFT JOIN cities c ON ca.city_id = c.id
       LEFT JOIN zones z ON ca.zone_id = z.id
       WHERE ca.id = ? AND ca.customer_id = ?`,
      [addressId, userId]
    )

    if (!addressResult || addressResult.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    const address = addressResult[0]

    return NextResponse.json({
      success: true,
      data: {
        id: address.id,
        street_address: address.street_address,
        additional_info: address.additional_info,
        city_id: address.city_id,
        zone_id: address.zone_id,
        is_default: address.is_default,
        city_name: address.city_name,
        zone_name: address.zone_name,
        delivery_fee: address.delivery_fee
      }
    })

  } catch (error) {
    console.error('Error fetching address:', error)
    return NextResponse.json(
      { error: 'Failed to fetch address' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addressId = parseInt(params.id)
    
    if (isNaN(addressId)) {
      return NextResponse.json({ error: 'Invalid address ID' }, { status: 400 })
    }

    const { street_address, additional_info, city_id, zone_id, is_default } = await request.json()

    // Validate input
    if (!street_address || !city_id || !zone_id) {
      return NextResponse.json(
        { error: 'Street address, city, and zone are required' },
        { status: 400 }
      )
    }

    const db = databaseService
    
    // Get user ID
    const userResult = await db.query(
      'SELECT id FROM customers WHERE email = ?',
      [session.user.email]
    )

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userResult[0].id

    // Check if address belongs to user
    const addressResult = await db.query(
      'SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [addressId, userId]
    )

    if (!addressResult || addressResult.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // Start transaction
    await db.transaction(async (connection) => {
      // If this is set as default, remove default from other addresses
      if (is_default) {
        await connection.execute(
          'UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ? AND id != ?',
          [userId, addressId]
        )
      }

      // Update the address
      await connection.execute(
        `UPDATE customer_addresses 
         SET street_address = ?, additional_info = ?, city_id = ?, zone_id = ?, is_default = ?
         WHERE id = ? AND customer_id = ?`,
        [street_address, additional_info || null, city_id, zone_id, is_default || false, addressId, userId]
      )
    })

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully'
    })

  } catch (error) {
    console.error('Error updating address:', error)
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addressId = parseInt(params.id)
    
    if (isNaN(addressId)) {
      return NextResponse.json({ error: 'Invalid address ID' }, { status: 400 })
    }

    const db = databaseService
    
    // Get user ID
    const userResult = await db.query(
      'SELECT id FROM customers WHERE email = ?',
      [session.user.email]
    )

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userResult[0].id

    // Check if address belongs to user
    const addressResult = await db.query(
      'SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [addressId, userId]
    )

    if (!addressResult || addressResult.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // Delete the address
    await db.query(
      'DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [addressId, userId]
    )

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    )
  }
} 