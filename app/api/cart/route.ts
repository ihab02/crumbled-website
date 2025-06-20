import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from '@/lib/services/databaseService';

interface Cart {
  id: number;
  session_id: string;
  status: string;
  created_at: Date;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  product_type_id: number;
  is_pack: boolean;
  count: number | null;
  flavor_size: string;
  base_price: number;
  is_active: boolean;
}

interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  is_pack: boolean;
  product_name?: string;
  base_price?: number;
  size?: string;
  image_url?: string;
  flavors?: Array<{
    flavor_id: number;
    flavor_name: string;
    mini_price: number;
    medium_price: number;
    large_price: number;
    quantity: number;
    size: string;
  }>;
}

interface FlavorResult {
  cart_item_id: number;
  flavor_id: number;
  flavor_name: string;
  mini_price: number;
  medium_price: number;
  large_price: number;
  quantity: number;
}

async function getCartId(): Promise<string> {
  const cookieStore = cookies();
  let cartId = cookieStore.get('cart_id')?.value;

  if (!cartId) {
    const sessionId = uuidv4();
    const result = await databaseService.query<{ insertId: number }>(
      'INSERT INTO carts (session_id, status, created_at) VALUES (?, "active", NOW())',
      [sessionId]
    );
    
    if (!result.insertId) {
      throw new Error('Failed to create cart');
    }
    
    cartId = result.insertId.toString();
    cookieStore.set('cart_id', cartId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
  }

  return cartId;
}

export async function GET() {
  try {
    const cartId = await getCartId();
    console.log('GET /api/cart - Cart ID from cookie:', cartId);

    // Get cart items with their flavors
    console.log('Fetching cart items for cart ID:', cartId);
    const [rows] = await databaseService.query<CartItem[]>(`
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
    `, [cartId]);
    console.log('Cart items found:', rows);

    // Ensure we have an array of items and convert data types
    const cartItems = (Array.isArray(rows) ? rows : rows ? [rows] : []).map(item => ({
      ...item,
      is_pack: Boolean(item.is_pack),
      base_price: Number(item.base_price),
      quantity: Number(item.quantity),
      count: Number(item.count)
    }));
    console.log('Processed cart items:', cartItems);

    // Get flavors for pack items
    console.log('Fetching flavors for pack items');
    const packItems = cartItems.filter((item) => item.is_pack);
    if (packItems.length > 0) {
      const packItemIds = packItems.map(item => item.id);
      console.log('Fetching flavors for pack items:', packItemIds);
      
      const [flavorRows] = await databaseService.query<any[]>(`
        SELECT 
          cif.cart_item_id,
          f.id as flavor_id,
          f.name as flavor_name,
          f.mini_price,
          f.medium_price,
          f.large_price,
          cif.quantity,
          cif.size
        FROM cart_item_flavors cif
        JOIN flavors f ON cif.flavor_id = f.id
        WHERE cif.cart_item_id IN (${packItemIds.join(',')})
      `);

      console.log('Raw flavor rows:', flavorRows);

      // Ensure we have an array of flavors and convert data types
      const flavors = (Array.isArray(flavorRows) ? flavorRows : flavorRows ? [flavorRows] : []).map(f => ({
        ...f,
        mini_price: Number(f.mini_price),
        medium_price: Number(f.medium_price),
        large_price: Number(f.large_price),
        quantity: Number(f.quantity),
        size: f.size 
      }));
      console.log('Processed flavors:', flavors);

      // Add flavors to their respective cart items
      cartItems.forEach((item) => {
        if (item.is_pack) {
          const itemFlavors = flavors.filter((f) => f.cart_item_id === item.id);
          console.log(`Flavors for item ${item.id}:`, itemFlavors);
          item.flavors = itemFlavors.map((f) => ({
            flavor_id: f.flavor_id,
            flavor_name: f.flavor_name,
            mini_price: f.mini_price,
            medium_price: f.medium_price,
            large_price: f.large_price,
            quantity: f.quantity,
            size: f.size
          }));
        }
      });
    }

    // Calculate totals
    const items = cartItems.map((item) => {
      let total = 0;
      let flavorDetails = '';

      if (item.is_pack && item.flavors) {
        // Calculate flavor prices and build flavor details string
        const flavorTotals = item.flavors.map((flavor: { [key: string]: any }) => {
          const priceKey = `${item.size?.toLowerCase()}_price` as keyof typeof flavor;
          const price = Number(flavor[priceKey]) || 0;
          const flavorTotal = price * flavor.quantity;
          flavorDetails += `${flavor.flavor_name} (x${flavor.quantity}) - +${price.toFixed(2)} EGP each\n`;
          return flavorTotal;
        });

        total = flavorTotals.reduce((sum: number, price: number) => sum + price, 0) + (item.base_price || 0) * item.quantity;
      } else {
        total = (item.base_price || 0) * item.quantity;
      }

      return {
        ...item,
        total,
        flavorDetails,
        packSize: item.is_pack ? `${item.count} pieces` : undefined
      };
    });

    const cartTotal = items.reduce((sum: number, item: { total: number }) => sum + item.total, 0);
    console.log('Final cart total:', cartTotal);

    return NextResponse.json({
      items: items.map(item => ({
        id: item.id,
        name: item.product_name,
        basePrice: item.base_price,
        quantity: item.quantity,
        isPack: item.is_pack,
        packSize: item.packSize,
        flavorDetails: item.flavorDetails,
        total: item.total,
        imageUrl: item.image_url,
        flavors: item.flavors?.map((flavor: { [key: string]: any }) => ({
          id: flavor.flavor_id,
          name: flavor.flavor_name,
          quantity: flavor.quantity,
          price: flavor[`${item.size?.toLowerCase()}_price`] || 0,
          size: flavor.size
        }))
      })),
      total: cartTotal
    });
  } catch (error) {
    console.error('Error in GET /api/cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('POST /api/cart - Request body:', body);
    
    let cartId = await getCartId();
    console.log('Cart ID:', cartId);

    // Verify cart exists and is active
    const cartResult = await databaseService.query<Cart[]>(
      'SELECT * FROM carts WHERE id = ?',
      [cartId]
    );

    if (cartResult.length === 0 || cartResult[0].status !== 'active') {
      console.log('Cart not found or inactive:', cartId);
      // Create a new cart
      const sessionId = uuidv4();
      const result = await databaseService.query<{ insertId: number }>(
        'INSERT INTO carts (session_id, status, created_at) VALUES (?, "active", NOW())',
        [sessionId]
      );
      
      if (!result.insertId) {
        throw new Error('Failed to create cart');
      }
      
      cartId = result.insertId.toString();
      console.log('Created new cart:', cartId);
      
      // Update the cookie
      const cookieStore = cookies();
      cookieStore.set('cart_id', cartId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });
    }

    // Get the product
    const productResult = await databaseService.query<Product[]>(
      'SELECT * FROM products WHERE id = ? AND is_active = true',
      [body.productId]
    );

    if (productResult.length === 0) {
      console.log('Product not found:', body.productId);
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const product = productResult[0];
    console.log('Found product:', product);

    // Check if item already exists in cart
    const existingItemResult = await databaseService.query<CartItem[]>(
      'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, product.id]
    );

    if (existingItemResult.length > 0) {
      // Update quantity if item exists
      console.log('Updating existing cart item:', existingItemResult[0].id);
      await databaseService.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
        [body.quantity || 1, existingItemResult[0].id]
      );
    } else {
      // Create new cart item
      console.log('Creating new cart item for product:', product.id);
      const createResult = await databaseService.query<{ insertId: number }>(
        'INSERT INTO cart_items (cart_id, product_id, quantity, is_pack) VALUES (?, ?, ?, ?)',
        [cartId, product.id, body.quantity || 1, product.is_pack]
      );

      // If it's a pack, add the flavors
      if (product.is_pack && body.flavors) {
        console.log('Adding flavors to pack:', body.flavors);
        for (const flavor of body.flavors) {
          await databaseService.query(
            'INSERT INTO cart_item_flavors (cart_item_id, flavor_id, quantity, size) VALUES (?, ?, ?, ?)',
            [createResult.insertId, flavor.id, flavor.quantity, flavor.size || 'Medium']
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ success: false, error: 'Failed to add to cart' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { itemId, quantity } = await request.json();
    const cookieStore = cookies();
    const cartId = cookieStore.get('cart_id')?.value;

    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    if (quantity <= 0) {
      // Remove item
      await databaseService.query(
        'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
        [itemId, cartId]
      );
    } else {
      // Update quantity
      await databaseService.query(
        'UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?',
        [quantity, itemId, cartId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/cart:', error);
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies();
    const cartId = cookieStore.get('cart_id')?.value;

    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Clear cart
    await databaseService.query(
      'DELETE FROM cart_items WHERE cart_id = ?',
      [cartId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/cart:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
} 