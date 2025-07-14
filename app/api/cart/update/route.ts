import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { databaseService } from '@/lib/services/databaseService'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { itemId, quantity } = body

    // Get cart ID from cookie
    const cookieStore = cookies()
    const cartId = cookieStore.get('cart_id')?.value

    if (!cartId) {
      return NextResponse.json({ 
        success: false, 
        error: "No cart found" 
      }, { status: 400 })
    }

    // Update cart item quantity
    await databaseService.query(
      `UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND id = ?`,
      [quantity, cartId, itemId]
    )

    return NextResponse.json({
      success: true,
      message: "Cart item updated successfully"
    })

  } catch (error) {
    console.error('Error updating cart item:', error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update cart item" 
    }, { status: 500 })
  }
} 