import { NextResponse } from 'next/server'
import { databaseService } from '@/lib/services/databaseService'
import { verifyJWT } from '@/lib/middleware/auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const db = databaseService

// Helper function to safely extract arrays from database results
function safeExtractArray(result: any): any[] {
  if (Array.isArray(result)) {
    return result
  }
  if (result && typeof result === 'object' && result.length !== undefined) {
    return Array.from(result)
  }
  return result ? [result] : []
}

export async function GET(request: any) {
  try {
    // Verify admin authentication using JWT token
    const token = request.cookies.get('adminToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all customers with correct column names
    const customers = await db.query(
      `SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        mobile,
        mobile_verified,
        email_verified,
        type,
        is_active,
        created_at,
        updated_at
       FROM customers 
       ORDER BY created_at DESC`
    )

    const customersArray = safeExtractArray(customers)

    // Transform the data to include a full name field
    const transformedCustomers = customersArray.map((customer: any) => ({
      ...customer,
      name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer'
    }))

    return NextResponse.json({
      success: true,
      data: transformedCustomers
    })

  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
} 