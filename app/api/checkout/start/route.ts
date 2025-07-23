import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';

interface CheckoutStartRequest {
  cartId?: string;
}

interface CheckoutStartResponse {
  success: boolean;
  message: string;
  data?: {
    userType: 'registered' | 'guest';
    user?: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
      addresses: Array<{
        id: number;
        street_address: string;
        additional_info?: string;
        city_name: string;
        zone_name: string;
        delivery_fee: number;
        is_default: boolean;
      }>;
    };
    cart?: {
      items: Array<{
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
      }>;
      total: number;
      itemCount: number;
    } | null;
    cities: Array<{
      id: number;
      name: string;
      is_active: boolean;
      zones: Array<{
        id: number;
        name: string;
        delivery_fee: number;
        is_active: boolean;
      }>;
    }>;
  };
  error?: string;
}

// Helper function to get or create cart (same as cart API)
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
    setCartCookie(cartId);
    console.log('Created new cart:', cartId);
  } else {
    const cartExists = await databaseService.query(
      'SELECT * FROM carts WHERE id = ? AND status = "active"',
      [cartId]
    );

    if (!Array.isArray(cartExists) || cartExists.length === 0) {
      const sessionId = uuidv4();
      const result = await databaseService.query<{ insertId: number }>(
        'INSERT INTO carts (session_id, status, created_at) VALUES (?, "active", NOW())',
        [sessionId]
      );
      
      cartId = result.insertId.toString();
      setCartCookie(cartId);
      console.log('Created new cart (old one invalid):', cartId);
    }
  }

  return cartId;
}

function setCartCookie(cartId: string) {
  const cookieStore = cookies();
  cookieStore.set('cart_id', cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60
  });
}

export async function POST(request: NextRequest): Promise<NextResponse<CheckoutStartResponse>> {
  try {
    console.log('🚀 Starting checkout process...')
    console.log('🚀 Request headers:', Object.fromEntries(request.headers.entries()))
    
    const session = await getServerSession(authOptions);
    console.log('👤 NextAuth session:', session);
    console.log('👤 Session user email:', session?.user?.email);
    console.log('👤 Session user name:', session?.user?.name);
    console.log('👤 Session user id:', session?.user?.id);
    
    // Check for custom JWT tokens
    const cookieStore = cookies();
    const customerToken = cookieStore.get('token');
    const adminToken = cookieStore.get('adminToken');
    const cartIdCookie = cookieStore.get('cart_id');
    
    console.log('👤 Custom customer token:', customerToken?.value ? 'Present' : 'Not found');
    console.log('👤 Custom admin token:', adminToken?.value ? 'Present' : 'Not found');
    console.log('🛒 Cart ID from cookies:', cartIdCookie?.value || 'Not found');
    
    let userData = null;
    let userType = 'guest';
    
    // Try NextAuth session first
    if (session?.user) {
      console.log('👤 Processing NextAuth user checkout...');
      console.log('👤 Session user email:', session.user.email);
      
      // Registered user through NextAuth
      const userResult = await databaseService.query(
        `SELECT c.id, c.first_name, c.last_name, c.email, c.phone
         FROM customers c
         WHERE c.email = ?`,
        [session.user.email]
      );

      console.log('👤 User result:', userResult);

      if (Array.isArray(userResult) && userResult.length > 0) {
        userData = userResult[0];
        userType = 'registered';
        console.log('✅ Found user in database:', userData);
      } else {
        console.log('❌ User not found in database for email:', session.user.email);
      }
    }
    // Try custom JWT token if NextAuth session is not available
    else if (customerToken?.value) {
      console.log('👤 Processing custom JWT user checkout...');
      
      try {
        // Import the JWT verification function
        const { verifyJWT } = await import('@/lib/middleware/auth');
        const decoded = await verifyJWT(customerToken.value, 'customer') as any;
        
        if (decoded && decoded.email) {
          console.log('👤 Decoded JWT user email:', decoded.email);
          
          // Get user data from database
          const userResult = await databaseService.query(
            `SELECT c.id, c.first_name, c.last_name, c.email, c.phone
             FROM customers c
             WHERE c.email = ?`,
            [decoded.email]
          );

          console.log('👤 Custom JWT user result:', userResult);

          if (Array.isArray(userResult) && userResult.length > 0) {
            userData = userResult[0];
            userType = 'registered';
            console.log('✅ Found user in database via custom JWT:', userData);
          } else {
            console.log('❌ User not found in database for custom JWT email:', decoded.email);
          }
        }
      } catch (error) {
        console.error('❌ Custom JWT verification error:', error);
      }
    }
    
    if (!userData) {
      console.log('👤 Processing guest user checkout...');
      userType = 'guest';
    }

    const cartId = await getOrCreateCart();
    
    console.log('🛒 Cart ID from cookies:', cartId)
    console.log('👤 Session user:', session?.user?.email)

    // Fetch cart data using session-based cart ID
    let cartData = null;
    if (cartId) {
      console.log('📦 Fetching cart items for cart ID:', cartId)
      const cartResult = await databaseService.query(
        `SELECT ci.id, ci.quantity, ci.product_id, ci.is_pack,
                p.name, p.base_price, p.image_url, p.flavor_size as pack_size, p.count
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.cart_id = ? AND p.is_active = true
         ORDER BY ci.id DESC`,
        [cartId]
      );
      
      console.log('📋 Raw cart result:', cartResult)
      console.log('📋 Cart result is array:', Array.isArray(cartResult))
      console.log('📋 Cart result length:', Array.isArray(cartResult) ? cartResult.length : 'not array')
      
      if (Array.isArray(cartResult) && cartResult.length > 0) {
        console.log('✅ Processing cart items...')
        // Process cart items
        const items = await Promise.all(cartResult.map(async (item: any) => {
          console.log('🔄 Processing item:', item)
          let flavors: Array<{
            id: number;
            name: string;
            quantity: number;
            price: number;
            size: string;
          }> = [];

          // Fetch flavors for pack items
          if (item.is_pack) {
            console.log('🍰 Fetching flavors for pack item:', item.id)
            const flavorResult = await databaseService.query(
              `SELECT f.id, f.name, cif.quantity,
                      CASE 
                        WHEN ? = 'mini' THEN f.mini_price
                        WHEN ? = 'medium' THEN f.medium_price
                        WHEN ? = 'large' THEN f.large_price
                        ELSE f.medium_price
                      END as price
               FROM cart_item_flavors cif
               JOIN flavors f ON cif.flavor_id = f.id
               WHERE cif.cart_item_id = ? AND f.is_active = true AND f.is_enabled = true AND f.deleted_at IS NULL`,
              [item.pack_size, item.pack_size, item.pack_size, item.id]
            );

            console.log('🍰 Flavor result for item', item.id, ':', flavorResult)

            if (Array.isArray(flavorResult)) {
              flavors = flavorResult.map((flavor: any) => ({
                id: flavor.id,
                name: flavor.name,
                quantity: flavor.quantity,
                price: flavor.price,
                size: item.pack_size // Use the product's pack size
              }));
            }
          }

          // Calculate total for this item
          const baseTotal = item.base_price * item.quantity;
          const flavorTotal = flavors.reduce((sum, flavor) => sum + (flavor.price * flavor.quantity), 0);
          const total = baseTotal + flavorTotal;

          const processedItem = {
            id: item.id,
            name: item.name,
            basePrice: item.base_price,
            quantity: item.quantity,
            isPack: item.is_pack,
            packSize: item.pack_size,
            imageUrl: item.image_url,
            count: item.count,
            flavorDetails: flavors.map(f => `${f.name} (${f.quantity}x)`).join(', '),
            total,
            flavors
          };
          
          console.log('✅ Processed item:', processedItem)
          return processedItem;
        }));
        
        const total = items.reduce((sum, item) => sum + item.total, 0);
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        
        cartData = { items, total, itemCount };
        console.log('📦 Final cart data:', cartData)
      } else {
        console.log('⚠️ No cart items found or cart result is invalid')
      }
    } else {
      console.log('⚠️ No cart ID found in cookies')
    }

    // Fetch cities and zones
    console.log('🏙️ Fetching cities and zones...')
    const citiesResult = await databaseService.query(
      `SELECT c.id, c.name, c.is_active, 
              z.id as zone_id, z.name as zone_name, z.delivery_fee, z.is_active as zone_active
       FROM cities c
       LEFT JOIN zones z ON c.id = z.city_id
       WHERE c.is_active = true
       ORDER BY c.id, z.id`
    );

    console.log('🏙️ Cities result:', citiesResult)

    const citiesMap = new Map();
    const citiesArray = Array.isArray(citiesResult) ? citiesResult : (citiesResult ? [citiesResult] : []);
    
    if (citiesArray.length > 0) {
      citiesArray.forEach((row: any) => {
        if (!citiesMap.has(row.id)) {
          citiesMap.set(row.id, {
            id: row.id,
            name: row.name,
            is_active: row.is_active,
            zones: []
          });
        }
        
        if (row.zone_id && row.zone_active) {
          citiesMap.get(row.id).zones.push({
            id: row.zone_id,
            name: row.zone_name,
            delivery_fee: row.delivery_fee,
            is_active: row.zone_active
          });
        }
      });
    }

    const cities = Array.from(citiesMap.values());
    console.log('🏙️ Processed cities:', cities)

    if (userData) {
      console.log('👤 Processing registered user checkout...')
      console.log('👤 Session user email:', userData.email)
      console.log('👤 Session user name:', userData.first_name + ' ' + userData.last_name)
      console.log('👤 Session user id:', userData.id)
      
      // Fetch user addresses
      const addressesResult = await databaseService.query(
        `SELECT ca.id, ca.street_address, ca.additional_info, 
                c.name as city_name, z.name as zone_name, z.delivery_fee, ca.is_default
         FROM customer_addresses ca
         JOIN cities c ON ca.city_id = c.id
         JOIN zones z ON ca.zone_id = z.id
         WHERE ca.customer_id = ?
         ORDER BY ca.is_default DESC, ca.id`,
        [userData.id]
      );

      console.log('🏠 Addresses result:', addressesResult)

      const addresses = Array.isArray(addressesResult) ? addressesResult.map((addr: any) => ({
        id: addr.id,
        street_address: addr.street_address,
        additional_info: addr.additional_info,
        city_name: addr.city_name,
        zone_name: addr.zone_name,
        delivery_fee: addr.delivery_fee,
        is_default: addr.is_default === 1
      })) : [];

      const responseData = {
        success: true,
        message: 'Checkout started for registered user',
        data: {
          userType: 'registered' as const,
          user: {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            phone: userData.phone,
            addresses
          },
          cart: cartData,
          cities
        }
      };
      
      console.log('✅ Returning registered user response:', responseData)
      return NextResponse.json(responseData);
    }

    console.log('👤 Processing guest user checkout...')
    // Guest user
    const responseData = {
      success: true,
      message: 'Checkout started for guest user',
      data: {
        userType: 'guest' as const,
        cart: cartData,
        cities
      }
    };
    
    console.log('✅ Returning guest user response:', responseData)
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Error starting checkout:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to start checkout',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 