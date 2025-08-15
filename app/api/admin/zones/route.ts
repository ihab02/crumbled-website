import { NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/middleware/auth'
import { databaseService } from '@/lib/services/databaseService'

export async function GET(request: any) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyJWT(token)
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all unique zones from orders
    const rows = await databaseService.query(`
      SELECT DISTINCT delivery_zone as zone 
      FROM orders 
      WHERE delivery_zone IS NOT NULL 
      AND delivery_zone != '' 
      ORDER BY delivery_zone
    `)

    const zones = rows.map((row: any) => row.zone)

    return NextResponse.json({
      success: true,
      zones: zones
    })
  } catch (error) {
    console.error('Error fetching zones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    )
  }
} 