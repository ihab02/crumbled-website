import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { databaseService } from '@/lib/services/databaseService'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Get user addresses
    const addressesResult = await db.query(
      `SELECT 
        ca.id,
        ca.street_address,
        ca.additional_info,
        c.name as city_name,
        z.name as zone_name,
        z.delivery_fee,
        ca.is_default
       FROM customer_addresses ca
       LEFT JOIN cities c ON ca.city_id = c.id
       LEFT JOIN zones z ON ca.zone_id = z.id
       WHERE ca.customer_id = ?
       ORDER BY ca.is_default DESC, ca.created_at DESC`,
      [userId]
    )

    return NextResponse.json({
      success: true,
      data: addressesResult || []
    })

  } catch (error) {
    console.error('Error fetching user addresses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user addresses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Start transaction
    await db.transaction(async (connection) => {
      // If this is set as default, remove default from other addresses
      if (is_default) {
        await connection.execute(
          'UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?',
          [userId]
        )
      }

      // Insert new address
      await connection.execute(
        `INSERT INTO customer_addresses 
         (customer_id, street_address, additional_info, city_id, zone_id, is_default, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [userId, street_address, additional_info || null, city_id, zone_id, is_default || false]
      )
    })

    return NextResponse.json({
      success: true,
      message: 'Address added successfully'
    })

  } catch (error) {
    console.error('Error adding address:', error)
    return NextResponse.json(
      { error: 'Failed to add address' },
      { status: 500 }
    )
  }
} 