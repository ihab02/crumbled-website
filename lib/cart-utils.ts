import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from '@/lib/services/databaseService';

// Types
interface Cart {
  id: number;
  session_id: string;
  status: string;
  created_at: Date;
  user_id?: number;
}

// Helper function to set cart cookie
function setCartCookie(cartId: string) {
  const cookieStore = cookies();
  cookieStore.set('cart_id', cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
}

// Helper Functions
export async function getOrCreateCart(userId?: number): Promise<string> {
  const cookieStore = cookies();
  let cartId = cookieStore.get('cart_id')?.value;

  // Get cart settings for expiration
  const cartSettings = await databaseService.query<{ cart_lifetime_days: number }[]>(
    'SELECT cart_lifetime_days FROM cart_settings LIMIT 1'
  );
  const cartLifetimeDays = cartSettings?.[0]?.cart_lifetime_days || 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + cartLifetimeDays);

  if (!cartId) {
    const sessionId = uuidv4();
    let result: any;
    
    if (userId) {
      // Create cart for logged-in user
      result = await databaseService.query<{ insertId: number }>(
        'INSERT INTO carts (user_id, session_id, status, created_at, expires_at) VALUES (?, ?, "active", NOW(), ?)',
        [userId, sessionId, expiresAt]
      );
      console.log('Created new cart for user:', userId, 'Cart ID:', result?.insertId);
    } else {
      // Create cart for guest user
      result = await databaseService.query<{ insertId: number }>(
        'INSERT INTO carts (session_id, status, created_at, expires_at) VALUES (?, "active", NOW(), ?)',
        [sessionId, expiresAt]
      );
      console.log('Created new cart for guest. Cart ID:', result?.insertId);
    }
    
    if (!result || !result.insertId) {
      throw new Error('Failed to create cart - no insertId returned');
    }
    
    cartId = result.insertId.toString();
    setCartCookie(cartId);
  } else {
    const cartExists = await databaseService.query<Cart[]>(
      'SELECT * FROM carts WHERE id = ? AND status = "active"',
      [cartId]
    );

    // Handle both array and single object results
    const cartExistsArray = Array.isArray(cartExists) ? cartExists : (cartExists ? [cartExists] : []);

    if (cartExistsArray.length === 0) {
      const sessionId = uuidv4();
      let result: any;
      
      if (userId) {
        // Create new cart for logged-in user
        result = await databaseService.query<{ insertId: number }>(
          'INSERT INTO carts (user_id, session_id, status, created_at, expires_at) VALUES (?, ?, "active", NOW(), ?)',
          [userId, sessionId, expiresAt]
        );
        console.log('Created new cart for user (old one invalid):', userId, 'Cart ID:', result?.insertId);
      } else {
        // Create new cart for guest user
        result = await databaseService.query<{ insertId: number }>(
          'INSERT INTO carts (session_id, status, created_at, expires_at) VALUES (?, "active", NOW(), ?)',
          [sessionId, expiresAt]
        );
        console.log('Created new cart for guest (old one invalid). Cart ID:', result?.insertId);
      }
      
      if (!result || !result.insertId) {
        throw new Error('Failed to create cart - no insertId returned');
      }
      
      cartId = result.insertId.toString();
      setCartCookie(cartId);
    } else {
      // Cart exists, update user_id if user is logged in and cart doesn't have user_id
      const existingCart = cartExistsArray[0];
      if (userId && !existingCart.user_id) {
        await databaseService.query(
          'UPDATE carts SET user_id = ?, expires_at = ? WHERE id = ?',
          [userId, expiresAt, cartId]
        );
        console.log('Updated cart with user_id:', userId, 'Cart ID:', cartId);
      }
    }
  }

  return cartId;
}
