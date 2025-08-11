import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id as string);
    const cookieStore = cookies();
    const guestCartId = cookieStore.get('cart_id')?.value;

    if (!guestCartId) {
      return NextResponse.json(
        { success: false, error: 'No guest cart found' },
        { status: 400 }
      );
    }

    console.log('Merging cart for user:', userId, 'Guest cart ID:', guestCartId);

    // Get guest cart items
    const guestCartItems = await databaseService.query(`
      SELECT ci.*, p.name as product_name, p.is_pack, p.base_price, p.flavor_size, p.image_url, p.count
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ? AND p.is_active = true
    `, [guestCartId]);

    if (!guestCartItems || guestCartItems.length === 0) {
      console.log('No items in guest cart to merge');
      return NextResponse.json({ success: true, message: 'No items to merge' });
    }

    // Get or create user's cart
    let userCartId: string;
    
    // Check if user already has an active cart
    const existingUserCart = await databaseService.query(`
      SELECT id FROM carts WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `, [userId]);

    if (existingUserCart && existingUserCart.length > 0) {
      userCartId = existingUserCart[0].id.toString();
      console.log('Using existing user cart:', userCartId);
    } else {
      // Create new cart for user
      const sessionId = crypto.randomUUID();
      const cartSettings = await databaseService.query<{ cart_lifetime_days: number }[]>(
        'SELECT cart_lifetime_days FROM cart_settings LIMIT 1'
      );
      const cartLifetimeDays = cartSettings?.[0]?.cart_lifetime_days || 7;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + cartLifetimeDays);

      const result = await databaseService.query<{ insertId: number }>(
        'INSERT INTO carts (user_id, session_id, status, created_at, expires_at) VALUES (?, ?, "active", NOW(), ?)',
        [userId, sessionId, expiresAt]
      );
      
      userCartId = result.insertId.toString();
      console.log('Created new user cart:', userCartId);
    }

    // Merge items from guest cart to user cart
    let mergedItems = 0;
    let skippedItems = 0;

    for (const guestItem of guestCartItems) {
      // Check if user already has this product in their cart
      const existingUserItem = await databaseService.query(`
        SELECT id, quantity FROM cart_items 
        WHERE cart_id = ? AND product_id = ?
      `, [userCartId, guestItem.product_id]);

      if (existingUserItem && existingUserItem.length > 0) {
        // Update quantity
        const newQuantity = existingUserItem[0].quantity + guestItem.quantity;
        await databaseService.query(
          'UPDATE cart_items SET quantity = ? WHERE id = ?',
          [newQuantity, existingUserItem[0].id]
        );
        console.log('Updated quantity for product:', guestItem.product_id, 'New quantity:', newQuantity);
      } else {
        // Add new item to user cart
        const insertResult = await databaseService.query<{ insertId: number }>(
          'INSERT INTO cart_items (cart_id, product_id, quantity, is_pack) VALUES (?, ?, ?, ?)',
          [userCartId, guestItem.product_id, guestItem.quantity, guestItem.is_pack]
        );

        // If it's a pack, copy flavors
        if (guestItem.is_pack) {
          const guestFlavors = await databaseService.query(`
            SELECT flavor_id, quantity FROM cart_item_flavors WHERE cart_item_id = ?
          `, [guestItem.id]);

          for (const flavor of guestFlavors) {
            await databaseService.query(
              'INSERT INTO cart_item_flavors (cart_item_id, flavor_id, quantity) VALUES (?, ?, ?)',
              [insertResult.insertId, flavor.flavor_id, flavor.quantity]
            );
          }
          console.log('Copied flavors for pack item:', guestItem.product_id);
        }

        mergedItems++;
        console.log('Added new item to user cart:', guestItem.product_name);
      }
    }

    // Mark guest cart as abandoned
    await databaseService.query(
      'UPDATE carts SET status = "abandoned" WHERE id = ?',
      [guestCartId]
    );

    // Update cookie to point to user cart
    cookieStore.set('cart_id', userCartId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    });

    console.log('Cart merge completed. Merged items:', mergedItems, 'Skipped items:', skippedItems);

    return NextResponse.json({
      success: true,
      message: 'Cart merged successfully',
      mergedItems,
      userCartId
    });

  } catch (error) {
    console.error('Error merging cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to merge cart' },
      { status: 500 }
    );
  }
}
