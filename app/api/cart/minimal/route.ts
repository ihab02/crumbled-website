import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from '@/lib/services/databaseService';

async function getOrCreateCart(): Promise<string> {
  const cookieStore = cookies();
  let cartId = cookieStore.get('cart_id')?.value;

  if (!cartId) {
    const sessionId = uuidv4();
    const result = await databaseService.query<{ insertId: number }>(
      'INSERT INTO carts (session_id, status, created_at) VALUES (?, "active", NOW())',
      [sessionId]
    );
    
    cartId = result.insertId.toString();
    cookieStore.set('cart_id', cartId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    });
  }

  return cartId;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Minimal POST /api/cart - Request body:', body);
    
    const cartId = await getOrCreateCart();
    console.log('Cart ID:', cartId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Minimal cart POST working',
      cartId: cartId,
      receivedData: body
    });
  } catch (error) {
    console.error('Error in minimal POST:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
} 