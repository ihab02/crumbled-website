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

    // Fetch all zones with details
    const rows = await databaseService.query(`
      SELECT 
        z.id,
        z.name,
        z.city_id,
        c.name as city_name,
        c.is_active as city_is_active,
        z.delivery_days,
        z.time_slot_id,
        dts.name as time_slot_name,
        dts.from_hour as time_slot_from,
        dts.to_hour as time_slot_to,
        z.delivery_fee,
        z.is_active,
        z.created_at,
        z.updated_at
      FROM zones z
      LEFT JOIN cities c ON z.city_id = c.id
      LEFT JOIN delivery_time_slots dts ON z.time_slot_id = dts.id
      WHERE z.is_active = 1
      ORDER BY z.name
    `)

    return NextResponse.json({
      success: true,
      zones: rows // Now an array of Zone objects
    })
  } catch (error) {
    console.error('Error fetching zones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    )
  }
} 