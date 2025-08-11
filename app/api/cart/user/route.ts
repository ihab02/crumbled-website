import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id as string);
    console.log('GET /api/cart/user - Fetching cart for user:', userId);

    // Get user's active cart
    const userCart = await databaseService.query(`
      SELECT id, session_id, status, created_at, expires_at
      FROM carts 
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);

    if (!userCart || userCart.length === 0) {
      console.log('No active cart found for user:', userId);
      return NextResponse.json({
        success: true,
        cart: null,
        items: [],
        total: 0,
        itemCount: 0
      });
    }

    const cartId = userCart[0].id;
    console.log('Found user cart:', cartId);

    // Get cart items
    const cartItems = await databaseService.query(`
      SELECT 
        ci.id,
        ci.quantity,
        ci.product_id,
        p.name as product_name,
        p.is_pack,
        p.base_price,
        p.flavor_size as size,
        p.image_url,
        p.count
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ? AND p.is_active = true
      ORDER BY ci.id DESC
    `, [cartId]);

    const cartItemsArray = Array.isArray(cartItems) ? cartItems : (cartItems ? [cartItems] : []);

    if (cartItemsArray.length === 0) {
      return NextResponse.json({
        success: true,
        cart: userCart[0],
        items: [],
        total: 0,
        itemCount: 0
      });
    }

    // Process items similar to main cart API
    const processedItems = cartItemsArray.map((item: any) => ({
      id: item.id,
      name: item.product_name || '',
      basePrice: Number(item.base_price),
      quantity: Number(item.quantity),
      isPack: Boolean(item.is_pack),
      packSize: item.size || '',
      imageUrl: item.image_url || '',
      count: Number(item.count),
      flavorDetails: '',
      total: 0,
      flavors: []
    }));

    // Get flavors for pack items
    const packItems = processedItems.filter((item: any) => item.isPack);
    if (packItems.length > 0) {
      const packItemIds = packItems.map((item: any) => item.id);
      
      const flavorRows = await databaseService.query(`
        SELECT 
          cif.cart_item_id,
          f.id as flavor_id,
          f.name as flavor_name,
          cif.quantity
        FROM cart_item_flavors cif
        JOIN flavors f ON cif.flavor_id = f.id
        WHERE cif.cart_item_id IN (${packItemIds.map(() => '?').join(',')})
      `, packItemIds);

      const flavorRowsArray = Array.isArray(flavorRows) ? flavorRows : (flavorRows ? [flavorRows] : []);

      processedItems.forEach((item: any) => {
        if (item.isPack) {
          const itemFlavors = flavorRowsArray.filter((f: any) => f.cart_item_id === item.id);
          item.flavors = itemFlavors.map((flavor: any) => ({
            id: flavor.flavor_id,
            name: flavor.flavor_name,
            quantity: flavor.quantity,
            price: 0, // Price is included in base price for packs
            size: item.packSize
          }));
        }
      });
    }

    const total = processedItems.reduce((sum, item) => {
      let itemTotal = item.basePrice * item.quantity;
      if (item.flavors && item.flavors.length > 0) {
        itemTotal += item.flavors.reduce((flavorSum, flavor) => {
          return flavorSum + (flavor.price * flavor.quantity);
        }, 0);
      }
      return sum + itemTotal;
    }, 0);

    const itemCount = processedItems.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json({
      success: true,
      cart: userCart[0],
      items: processedItems,
      total,
      itemCount
    });

  } catch (error) {
    console.error('Error fetching user cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user cart' },
      { status: 500 }
    );
  }
}
