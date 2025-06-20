import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { databaseService } from '@/lib/services/databaseService'

// Helper function to get or create cart
async function getOrCreateCart(): Promise<string> {
  const cookieStore = cookies();
  let cartId = cookieStore.get('cart_id')?.value;

  if (!cartId) {
    throw new Error('Cart not found');
  }

  // Verify cart exists
  const cartExists = await databaseService.query(
    'SELECT * FROM carts WHERE id = ? AND status = "active"',
    [cartId]
  );

  if (!cartExists || (Array.isArray(cartExists) ? cartExists.length === 0 : true)) {
    throw new Error('Cart not found or inactive');
  }

  return cartId;
}

// PUT /api/cart/update
export async function PUT(request: Request) {
  try {
    const cartId = await getOrCreateCart();
    const { itemId, quantity } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      // Remove item and its flavors
      await databaseService.query(
        'DELETE FROM cart_item_flavors WHERE cart_item_id = ?',
        [itemId]
      );
      
      await databaseService.query(
        'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
        [itemId, cartId]
      );
      
      console.log('Removed item from cart:', itemId);
    } else {
      // Update quantity
      await databaseService.query(
        'UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?',
        [quantity, itemId, cartId]
      );
      
      console.log('Updated item quantity:', itemId, 'to', quantity);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/cart/update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cart' },
      { status: 500 }
    );
  }
} 