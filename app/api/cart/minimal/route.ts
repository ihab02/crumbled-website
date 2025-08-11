import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from '@/lib/services/databaseService';
import { getOrCreateCart } from '@/lib/cart-utils';

export async function GET() {
  try {
    const cartId = await getOrCreateCart();

    // Fetch cart items count
    const cartItems = await databaseService.query(
      'SELECT COUNT(*) as count FROM cart_items WHERE cart_id = ?',
      [cartId]
    );

    const itemCount = Array.isArray(cartItems) ? cartItems[0]?.count || 0 : cartItems?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        itemCount: parseInt(itemCount.toString())
      }
    });

  } catch (error) {
    console.error('Error fetching minimal cart data:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch cart data" 
    }, { status: 500 });
  }
} 