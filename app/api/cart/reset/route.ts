import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from '@/lib/services/databaseService';

export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Clear the existing cart cookie
    cookieStore.delete('cart_id');
    
    // Create a new cart
    const sessionId = uuidv4();
    const result = await databaseService.query<{ insertId: number }>(
      'INSERT INTO carts (session_id, status, created_at) VALUES (?, "active", NOW())',
      [sessionId]
    );
    
    if (!result.insertId) {
      throw new Error('Failed to create new cart');
    }
    
    const newCartId = result.insertId.toString();
    
    // Set the new cart cookie
    cookieStore.set('cart_id', newCartId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
    
    console.log('Cart reset - New cart ID:', newCartId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cart session reset successfully',
      cartId: newCartId
    });
  } catch (error) {
    console.error('Error resetting cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset cart' },
      { status: 500 }
    );
  }
} 