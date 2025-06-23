import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { databaseService } from '@/lib/services/databaseService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ 
    success: true, 
    message: 'Stock route is working',
    id: params.id 
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('PUT method called for stock route')
  try {
    const { id } = params
    const data = await request.json()

    console.log('Stock update request:', { id, data })

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Flavor ID is required' },
        { status: 400 }
      )
    }

    const { size, quantity, change_type = 'addition', notes = '' } = data

    if (!size || !['mini', 'medium', 'large'].includes(size)) {
      return NextResponse.json(
        { success: false, error: 'Valid size (mini, medium, large) is required' },
        { status: 400 }
      )
    }

    if (quantity === undefined || quantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid quantity is required' },
        { status: 400 }
      )
    }

    // Get current stock for the specific size
    const [currentStock] = await databaseService.query(
      `SELECT stock_quantity_${size} FROM flavors WHERE id = ?`,
      [id]
    )

    console.log('Current stock query result:', currentStock)

    if (!Array.isArray(currentStock) || currentStock.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Flavor not found' },
        { status: 404 }
      )
    }

    const oldQuantity = currentStock[0][`stock_quantity_${size}`] || 0
    let newQuantity = oldQuantity

    // Calculate new quantity based on change type
    switch (change_type) {
      case 'addition':
        newQuantity = oldQuantity + quantity
        break
      case 'subtraction':
        newQuantity = Math.max(0, oldQuantity - quantity)
        break
      case 'replacement':
        newQuantity = quantity
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid change type' },
          { status: 400 }
        )
    }

    console.log('Stock calculation:', { oldQuantity, newQuantity, change_type, quantity })

    // Update the stock for the specific size
    await databaseService.query(
      `UPDATE flavors SET stock_quantity_${size} = ?, updated_at = NOW() WHERE id = ?`,
      [newQuantity, id]
    )

    // Log the stock change
    await databaseService.query(
      `INSERT INTO stock_history (item_id, item_type, size, old_quantity, new_quantity, change_amount, change_type, notes, changed_by) VALUES (?, 'flavor', ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        size,
        oldQuantity,
        newQuantity,
        newQuantity - oldQuantity,
        change_type,
        notes,
        'Admin'
      ]
    )

    console.log('Stock updated successfully')

    return NextResponse.json({
      success: true,
      message: `Stock updated successfully for ${size} size`,
      data: {
        old_quantity: oldQuantity,
        new_quantity: newQuantity,
        change_amount: newQuantity - oldQuantity
      }
    })
  } catch (error) {
    console.error('Error updating flavor stock:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update flavor stock' },
      { status: 500 }
    )
  }
} 