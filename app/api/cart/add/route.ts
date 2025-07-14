import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { databaseService } from '@/lib/services/databaseService'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, name, price, quantity, image, isBundle, bundleSize, bundleDiscount, bundleItems } = body

    // Get cart ID from cookie
    const cookieStore = cookies()
    const cartId = cookieStore.get('cart_id')?.value

    if (!cartId) {
      return NextResponse.json({ 
        success: false, 
        error: "No cart found" 
      }, { status: 400 })
    }

    // Add item to cart
    const result = await databaseService.query(
      `INSERT INTO cart_items (cart_id, product_instance_id, quantity) 
       VALUES (?, ?, ?)`,
      [cartId, id, quantity]
    )

    // If it's a bundle, add bundle items
    if (isBundle && bundleItems && bundleItems.length > 0) {
      const cartItemId = result.insertId
      
      for (const bundleItem of bundleItems) {
        await databaseService.query(
          `INSERT INTO cart_item_flavors (cart_item_id, flavor_id, flavor_name, size_id, size_name, quantity) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            cartItemId,
            bundleItem.id,
            bundleItem.name,
            bundleItem.size_id || 1,
            bundleItem.size_name || 'Standard',
            bundleItem.quantity || 1
          ]
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Item added to cart successfully"
    })

  } catch (error) {
    console.error('Error adding item to cart:', error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to add item to cart" 
    }, { status: 500 })
  }
} 