import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { databaseService } from '@/lib/services/databaseService'

export async function DELETE(request: Request) {
  return clearCart()
}

export async function POST(request: Request) {
  return clearCart()
}

async function clearCart() {
  try {
    // Get cart ID from cookie
    const cookieStore = cookies()
    const cartId = cookieStore.get('cart_id')?.value

    if (!cartId) {
      return NextResponse.json({ 
        success: false, 
        error: "No cart found" 
      }, { status: 400 })
    }

    // Remove all cart item flavors first
    await databaseService.query(
      `DELETE cif FROM cart_item_flavors cif
       INNER JOIN cart_items ci ON cif.cart_item_id = ci.id
       WHERE ci.cart_id = ?`,
      [cartId]
    )

    // Remove all cart items
    await databaseService.query(
      `DELETE FROM cart_items WHERE cart_id = ?`,
      [cartId]
    )

    return NextResponse.json({
      success: true,
      message: "Cart cleared successfully"
    })

  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to clear cart" 
    }, { status: 500 })
  }
} 