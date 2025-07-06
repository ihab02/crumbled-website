import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { databaseService } from '@/lib/services/databaseService'

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
      // Remove default from all user addresses
      await connection.execute(
        'UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?',
        [userId]
      )

      // Set the selected address as default
      await connection.execute(
        'UPDATE customer_addresses SET is_default = 1 WHERE id = ? AND customer_id = ?',
        [addressId, userId]
      )
    })

    return NextResponse.json({
      success: true,
      message: 'Default address updated successfully'
    })

  } catch (error) {
    console.error('Error updating default address:', error)
    return NextResponse.json(
      { error: 'Failed to update default address' },
      { status: 500 }
    )
  }
} 