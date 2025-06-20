import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Clear the cart cookie
    cookieStore.delete('cart_id');
    
    console.log('Cart cookie cleared');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cart session cleared' 
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
} 