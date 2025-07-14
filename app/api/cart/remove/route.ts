import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { databaseService } from '@/lib/services/databaseService'

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { itemId } = body

    // Get cart ID from cookie
    const cookieStore = cookies()
    const cartId = cookieStore.get('cart_id')?.value

    if (!cartId) {
      return NextResponse.json({ 
        success: false, 
        error: "No cart found" 
      }, { status: 400 })
    }

    // Remove cart item flavors first
    await databaseService.query(
      `DELETE cif FROM cart_item_flavors cif
       INNER JOIN cart_items ci ON cif.cart_item_id = ci.id
       WHERE ci.cart_id = ? AND ci.id = ?`,
      [cartId, itemId]
    )

    // Remove cart item
    await databaseService.query(
      `DELETE FROM cart_items WHERE cart_id = ? AND id = ?`,
      [cartId, itemId]
    )

    return NextResponse.json({
      success: true,
      message: "Item removed from cart successfully"
    })

  } catch (error) {
    console.error('Error removing item from cart:', error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to remove item from cart" 
    }, { status: 500 })
  }
} 