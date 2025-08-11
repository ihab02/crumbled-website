import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from '@/lib/services/databaseService';
import { getOrCreateCart } from '@/lib/cart-utils';

// Types
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
  image_url: string | null;
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
  count?: number;
  flavors?: CartItemFlavor[];
}

interface CartItemFlavor {
  cart_item_id: number;
  flavor_id: number;
  flavor_name: string;
  mini_price: number;
  medium_price: number;
  large_price: number;
  quantity: number;
}

interface FlavorSelection {
  id: number;
  quantity: number;
  size: string;
}

interface ProcessedCartItem {
  id: number;
  name: string;
  basePrice: number;
  quantity: number;
  isPack: boolean;
  packSize: string;
  imageUrl: string;
  count: number;
  flavorDetails: string;
  total: number;
  flavors: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    size: string;
  }>;
}

// API Routes
export async function GET() {
  try {
    // Get user information from session
    let userId: number | undefined;
    
    try {
      const { getServerSession } = await import('next-auth');
      const { authOptions } = await import('@/lib/auth-options');
      const session = await getServerSession(authOptions);
      
      if (session?.user?.id) {
        userId = parseInt(session.user.id as string);
        console.log('GET /api/cart - User logged in:', userId);
      }
    } catch (error) {
      console.log('GET /api/cart - No user session or auth error:', error);
    }
    
    let cartId: string;
    try {
      cartId = await getOrCreateCart(userId);
      console.log('GET /api/cart - Cart ID from cookie:', cartId);
    } catch (error) {
      console.error('Error in getOrCreateCart:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to get or create cart',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    const cartItems = await databaseService.query<CartItem[]>(`
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

    console.log('Raw cartItems from database:', cartItems);
    console.log('cartItems type:', typeof cartItems);
    console.log('cartItems is array:', Array.isArray(cartItems));
    console.log('cartItems length:', Array.isArray(cartItems) ? cartItems.length : 'not array');

    const cartItemsArray = Array.isArray(cartItems) ? cartItems : (cartItems ? [cartItems] : []);

    if (cartItemsArray.length === 0) {
      console.log('No cart items found, returning empty cart');
      return NextResponse.json({
        items: [],
        total: 0,
        itemCount: 0
      });
    }

    console.log('Cart items found:', cartItemsArray);
    console.log('Cart items array length:', cartItemsArray.length);

    const processedItems: ProcessedCartItem[] = cartItemsArray.map((item: CartItem) => ({
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

    const packItems = processedItems.filter((item: ProcessedCartItem) => item.isPack);
    if (packItems.length > 0) {
      const packItemIds = packItems.map((item: ProcessedCartItem) => item.id);
      console.log('Fetching flavors for pack items:', packItemIds);
      
      const flavorRows = await databaseService.query<CartItemFlavor[]>(`
        SELECT 
          cif.cart_item_id,
          f.id as flavor_id,
          f.name as flavor_name,
          f.mini_price,
          f.medium_price,
          f.large_price,
          cif.quantity
        FROM cart_item_flavors cif
        JOIN flavors f ON cif.flavor_id = f.id
        WHERE cif.cart_item_id IN (${packItemIds.join(',')}) AND f.is_active = true AND f.is_enabled = true AND f.deleted_at IS NULL
        ORDER BY cif.cart_item_id, f.name
      `);

      console.log('Raw flavor rows from database:', flavorRows);
      console.log('Flavor rows type:', typeof flavorRows);
      console.log('Flavor rows is array:', Array.isArray(flavorRows));
      console.log('Flavor rows length:', Array.isArray(flavorRows) ? flavorRows.length : 'not array');

      const processedFlavors = (Array.isArray(flavorRows) ? flavorRows : flavorRows ? [flavorRows] : []).map((f: CartItemFlavor) => ({
        ...f,
        mini_price: Number(f.mini_price),
        medium_price: Number(f.medium_price),
        large_price: Number(f.large_price),
        quantity: Number(f.quantity)
      }));

      console.log('Processed flavors array:', processedFlavors);
      console.log('Processed flavors length:', processedFlavors.length);

      processedItems.forEach((item: ProcessedCartItem) => {
        if (item.isPack) {
          const itemFlavors = processedFlavors.filter((f: CartItemFlavor) => f.cart_item_id === item.id);
          console.log(`Processing flavors for item ${item.id}:`, itemFlavors);
          console.log(`Item ${item.id} flavor count:`, itemFlavors.length);
          
          item.flavors = itemFlavors.map(flavor => ({
            id: flavor.flavor_id,
            name: flavor.flavor_name,
            quantity: flavor.quantity,
            price: item.packSize === 'Large' ? flavor.large_price : 
                   item.packSize === 'Medium' ? flavor.medium_price : flavor.mini_price,
            size: item.packSize
          }));
          
          console.log(`Final processed flavors for item ${item.id}:`, item.flavors);
          console.log(`Final flavor count for item ${item.id}:`, item.flavors.length);
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
      items: processedItems,
      total,
      itemCount
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
    
    // Get user information from session
    let userId: number | undefined;
    
    try {
      const { getServerSession } = await import('next-auth');
      const { authOptions } = await import('@/lib/auth-options');
      const session = await getServerSession(authOptions);
      
      if (session?.user?.id) {
        userId = parseInt(session.user.id as string);
        console.log('POST /api/cart - User logged in:', userId);
      }
    } catch (error) {
      console.log('POST /api/cart - No user session or auth error:', error);
    }
    
    const cartId = await getOrCreateCart(userId);
    console.log('Cart ID:', cartId);

    if (!body.productId) {
      console.log('Missing productId, returning 400');
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    console.log('Looking for product with ID:', body.productId);
    const [productResult] = await databaseService.query<Product[]>(
      'SELECT * FROM products WHERE id = ? AND is_active = true',
      [body.productId]
    );

    console.log('Product query result:', productResult);
    console.log('Product result type:', typeof productResult);
    console.log('Product result is array:', Array.isArray(productResult));
    console.log('Product result length:', Array.isArray(productResult) ? productResult.length : 'not array');
    
    // Handle both single object and array responses
    let product: Product | null = null;
    if (Array.isArray(productResult)) {
      product = productResult.length > 0 ? productResult[0] : null;
    } else if (productResult && typeof productResult === 'object') {
      product = productResult as Product;
    }

    if (!product) {
      console.log('Product not found, returning 404');
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    console.log('Found product:', product);

    if (product.is_pack) {
      if (!body.flavors || !Array.isArray(body.flavors) || body.flavors.length === 0) {
        console.log('Flavors required for pack, returning 400');
        return NextResponse.json({ success: false, error: 'Flavors are required for packs' }, { status: 400 });
      }

      const totalFlavorQuantity = body.flavors.reduce((sum: number, flavor: FlavorSelection) => sum + flavor.quantity, 0);
      if (totalFlavorQuantity !== product.count) {
        console.log(`Flavor quantity mismatch: ${totalFlavorQuantity} != ${product.count}, returning 400`);
        return NextResponse.json({ 
          success: false, 
          error: `Please select exactly ${product.count} flavors for this pack` 
        }, { status: 400 });
      }
    }

    if (product.is_pack && body.flavors && body.flavors.length > 0) {
      console.log('Creating new cart item for pack with flavors');
      
      const createResult = await databaseService.query<{ insertId: number }>(
        'INSERT INTO cart_items (cart_id, product_id, quantity, is_pack) VALUES (?, ?, ?, ?)',
        [cartId, product.id, body.quantity || 1, product.is_pack]
      );

      const cartItemId = Array.isArray(createResult) ? createResult[0].insertId : createResult.insertId;
      console.log('Created cart item:', cartItemId);
      
      for (const flavor of body.flavors) {
        await databaseService.query(
          'INSERT INTO cart_item_flavors (cart_item_id, flavor_id, quantity) VALUES (?, ?, ?)',
          [cartItemId, flavor.id, flavor.quantity]
        );
      }

      console.log('Successfully added pack with flavors to cart');
      return NextResponse.json({ success: true, cartItemId });
    } else {
      const existingItemResult = await databaseService.query<CartItem[]>(
        'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
        [cartId, product.id]
      );

      if (existingItemResult.length > 0) {
        console.log('Updating existing cart item:', existingItemResult[0].id);
        await databaseService.query(
          'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
          [body.quantity || 1, existingItemResult[0].id]
        );
      } else {
        console.log('Creating new cart item for product:', product.id);
        const createResult = await databaseService.query<{ insertId: number }>(
          'INSERT INTO cart_items (cart_id, product_id, quantity, is_pack) VALUES (?, ?, ?, ?)',
          [cartId, product.id, body.quantity || 1, product.is_pack]
        );

        const cartItemId = Array.isArray(createResult) ? createResult[0].insertId : createResult.insertId;
        console.log('Created cart item:', cartItemId);
      }

      console.log('Successfully added to cart');
      return NextResponse.json({ success: true });
    }

  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ success: false, error: 'Failed to add to cart' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Get user information from session
    let userId: number | undefined;
    
    try {
      const { getServerSession } = await import('next-auth');
      const { authOptions } = await import('@/lib/auth-options');
      const session = await getServerSession(authOptions);
      
      if (session?.user?.id) {
        userId = parseInt(session.user.id as string);
        console.log('DELETE /api/cart - User logged in:', userId);
      }
    } catch (error) {
      console.log('DELETE /api/cart - No user session or auth error:', error);
    }
    
    const cartId = await getOrCreateCart(userId);
    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Delete all flavors for this cart item first
    await databaseService.query(
      'DELETE FROM cart_item_flavors WHERE cart_item_id = ?',
      [itemId]
    );

    // Delete the cart item
    const result = await databaseService.query(
      'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
      [itemId, cartId]
    );

    console.log('Removed item from cart:', itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove item' },
      { status: 500 }
    );
  }
} 