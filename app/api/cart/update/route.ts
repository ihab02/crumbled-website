import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// Get or create cart session
async function getCartSession() {
  const cookieStore = cookies()
  let sessionId = cookieStore.get('cart_session')?.value

  if (!sessionId) {
    return null
  }

  return sessionId
}

// Get cart
async function getCart(sessionId: string) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM carts WHERE session_id = ? AND status = "active" LIMIT 1',
      [sessionId]
    )

    if (rows.length === 0) {
      return null
    }

    const cart = rows[0]
    const [items] = await pool.query(
      `SELECT ci.*, p.name as product_name, p.base_price, p.is_pack, p.count as pack_size, p.image_url
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?`,
      [cart.id]
    )

    // Fetch flavors for each item
    const itemsWithFlavors = await Promise.all(items.map(async (item: any) => {
      const [flavors] = await pool.query(
        `SELECT f.id, f.name, f.mini_price as price, cif.quantity
        FROM cart_item_flavors cif
        JOIN flavors f ON cif.flavor_id = f.id
        WHERE cif.cart_item_id = ?`,
        [item.id]
      )
      return {
        ...item,
        flavors: flavors || []
      }
    }))

    return {
      id: cart.id,
      items: itemsWithFlavors
    }
  } catch (error) {
    console.error('Error in getCart:', error)
    throw error
  }
}

// PUT /api/cart/update
export async function PUT(request: Request) {
  try {
    const sessionId = await getCartSession()
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'No active cart session' },
        { status: 400 }
      )
    }

    const { itemId, quantity } = await request.json()

    const [result] = await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id IN (SELECT id FROM carts WHERE session_id = ?)',
      [quantity, itemId, sessionId]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    const cart = await getCart(sessionId)
    return NextResponse.json({ success: true, cart })
  } catch (error) {
    console.error('Error in PUT /api/cart/update:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
} 