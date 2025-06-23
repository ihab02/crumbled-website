import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { databaseService } from '@/lib/services/databaseService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get product stock information
    const [result] = await databaseService.query(
      `SELECT 
        id,
        name,
        stock_quantity,
        is_available,
        is_active
      FROM products 
      WHERE id = ?`,
      [id]
    )

    if (!result || (Array.isArray(result) && result.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const product = Array.isArray(result) ? result[0] : result

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        stock: product.stock_quantity || 0,
        is_available: Boolean(product.is_available),
        is_active: Boolean(product.is_active)
      }
    })
  } catch (error) {
    console.error('Error fetching product stock:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product stock' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('PUT method called for product stock route')
  try {
    const { id } = params
    const data = await request.json()

    console.log('Product stock update request:', { id, data })

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const { quantity, change_type = 'addition', notes = '' } = data

    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { success: false, error: 'Valid quantity is required' },
        { status: 400 }
      )
    }

    // Get current stock
    const [currentStock] = await databaseService.query(
      `SELECT stock_quantity FROM products WHERE id = ?`,
      [id]
    )

    console.log('Current stock query result:', currentStock)

    if (!currentStock || (Array.isArray(currentStock) && currentStock.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const stockRow = Array.isArray(currentStock) ? currentStock[0] : currentStock
    const oldQuantity = stockRow.stock_quantity || 0
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

    // Update the stock
    await databaseService.query(
      `UPDATE products SET stock_quantity = ?, updated_at = NOW() WHERE id = ?`,
      [newQuantity, id]
    )

    // Log the stock change
    await databaseService.query(
      `INSERT INTO stock_history (item_id, item_type, old_quantity, new_quantity, change_amount, change_type, notes, changed_by) VALUES (?, 'product', ?, ?, ?, ?, ?, ?)`,
      [
        id,
        oldQuantity,
        newQuantity,
        newQuantity - oldQuantity,
        change_type,
        notes,
        'Admin'
      ]
    )

    console.log('Product stock updated successfully')

    return NextResponse.json({
      success: true,
      message: `Product stock updated successfully`,
      data: {
        old_quantity: oldQuantity,
        new_quantity: newQuantity,
        change_amount: newQuantity - oldQuantity
      }
    })
  } catch (error) {
    console.error('Error updating product stock:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update product stock' },
      { status: 500 }
    )
  }
} 