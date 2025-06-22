import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';

interface CheckoutConfirmRequest {
  cartId?: string;
  guestData?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zone: string;
    additionalInfo?: string;
  };
  selectedAddressId?: number;
  useNewAddress?: boolean;
  newAddress?: {
    street_address: string;
    additional_info?: string;
    city_id: number;
    zone_id: number;
  };
}

interface CheckoutConfirmResponse {
  success: boolean;
  message: string;
  data?: {
    cart: {
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
      subtotal: number;
      deliveryFee: number;
      total: number;
      itemCount: number;
    };
    deliveryAddress: {
      street_address: string;
      additional_info?: string;
      city_name: string;
      zone_name: string;
      delivery_fee: number;
    };
    customerInfo: {
      name: string;
      email: string;
      phone: string;
    };
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

export async function POST(request: NextRequest): Promise<NextResponse<CheckoutConfirmResponse>> {
  try {
    console.log('🔍 [DEBUG] Confirm API called')
    const session = await getServerSession(authOptions);
    const { guestData, selectedAddressId, useNewAddress, newAddress } = await request.json() as CheckoutConfirmRequest;
    const cartId = await getOrCreateCart();

    console.log('🔍 [DEBUG] Confirm API - Session:', session?.user?.email)
    console.log('🔍 [DEBUG] Confirm API - Selected Address ID:', selectedAddressId)
    console.log('🔍 [DEBUG] Confirm API - Use New Address:', useNewAddress)
    console.log('🔍 [DEBUG] Confirm API - Cart ID:', cartId)

    // Validate cart
    if (!cartId) {
      console.error('❌ [DEBUG] Confirm API - No cart ID found')
      return NextResponse.json({
        success: false,
        message: 'Cart not found',
        error: 'No active cart found'
      }, { status: 400 });
    }

    console.log('🔍 [DEBUG] Confirm API - Fetching cart items')
    // Fetch and validate cart items
    const [cartResult] = await databaseService.query(
      `SELECT ci.id, ci.quantity, ci.product_id, ci.is_pack,
              p.name, p.base_price, p.image_url, p.flavor_size as pack_size, p.count, p.stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ? AND p.is_active = true
       ORDER BY ci.id DESC`,
      [cartId]
    );

    console.log('🔍 [DEBUG] Confirm API - Cart result:', cartResult)

    if (!Array.isArray(cartResult) || cartResult.length === 0) {
      console.error('❌ [DEBUG] Confirm API - Cart is empty')
      return NextResponse.json({
        success: false,
        message: 'Cart is empty',
        error: 'No items found in cart'
      }, { status: 400 });
    }

    // Check stock availability
    const outOfStockItems = cartResult.filter((item: any) => item.quantity > item.stock_quantity);
    if (outOfStockItems.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Some items are out of stock',
        error: `Insufficient stock for: ${outOfStockItems.map((item: any) => item.name).join(', ')}`
      }, { status: 400 });
    }

    // Process cart items with flavors
    const items = await Promise.all(cartResult.map(async (item: any) => {
      let flavors: Array<{
        id: number;
        name: string;
        quantity: number;
        price: number;
        size: string;
      }> = [];

      // Fetch flavors for pack items
      if (item.is_pack) {
        const [flavorResult] = await databaseService.query(
          `SELECT f.id, f.name, cif.quantity, cif.size,
                  CASE 
                    WHEN cif.size = 'mini' THEN f.mini_price
                    WHEN cif.size = 'medium' THEN f.medium_price
                    WHEN cif.size = 'large' THEN f.large_price
                    ELSE f.medium_price
                  END as price
           FROM cart_item_flavors cif
           JOIN flavors f ON cif.flavor_id = f.id
           WHERE cif.cart_item_id = ?`,
          [item.id]
        );

        if (Array.isArray(flavorResult)) {
          flavors = flavorResult.map((flavor: any) => ({
            id: flavor.id,
            name: flavor.name,
            quantity: flavor.quantity,
            price: flavor.price,
            size: flavor.size
          }));
        }
      }

      // Calculate total for this item
      const baseTotal = item.base_price * item.quantity;
      const flavorTotal = flavors.reduce((sum, flavor) => sum + (flavor.price * flavor.quantity), 0);
      const total = baseTotal + flavorTotal;

      return {
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
    }));

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Handle delivery address
    let deliveryAddress;
    let deliveryFee = 0;
    let customerInfo;

    if (session?.user) {
      // Registered user
      if (useNewAddress && newAddress) {
        // Use new address
        const [zoneResult] = await databaseService.query(
          'SELECT z.delivery_fee, c.name as city_name, z.name as zone_name FROM zones z JOIN cities c ON z.city_id = c.id WHERE z.id = ?',
          [newAddress.zone_id]
        );

        if (Array.isArray(zoneResult) && zoneResult.length > 0) {
          const zone = zoneResult[0];
          deliveryFee = zone.delivery_fee;
          deliveryAddress = {
            street_address: newAddress.street_address,
            additional_info: newAddress.additional_info,
            city_name: zone.city_name,
            zone_name: zone.zone_name,
            delivery_fee: zone.delivery_fee
          };
        }
      } else if (selectedAddressId) {
        // Use selected saved address
        console.log('🔍 [DEBUG] Confirm API - Looking up saved address ID:', selectedAddressId)
        console.log('🔍 [DEBUG] Confirm API - User email:', session.user.email)
        
        const [addressResult] = await databaseService.query(
          `SELECT ca.street_address, ca.additional_info, c.name as city_name, z.name as zone_name, z.delivery_fee
           FROM customer_addresses ca
           JOIN cities c ON ca.city_id = c.id
           JOIN zones z ON ca.zone_id = z.id
           WHERE ca.id = ? AND ca.customer_id = (SELECT id FROM customers WHERE email = ?)`,
          [selectedAddressId, session.user.email]
        );

        console.log('🔍 [DEBUG] Confirm API - Address lookup result:', addressResult)

        if (Array.isArray(addressResult) && addressResult.length > 0) {
          const address = addressResult[0];
          deliveryFee = address.delivery_fee;
          deliveryAddress = {
            street_address: address.street_address,
            additional_info: address.additional_info,
            city_name: address.city_name,
            zone_name: address.zone_name,
            delivery_fee: address.delivery_fee
          };
          console.log('🔍 [DEBUG] Confirm API - Delivery address set:', deliveryAddress)
        } else {
          console.error('❌ [DEBUG] Confirm API - No address found for ID:', selectedAddressId)
        }
      }

      // Get customer info
      const [userResult] = await databaseService.query(
        'SELECT first_name, last_name, email, phone FROM customers WHERE email = ?',
        [session.user.email]
      );

      if (Array.isArray(userResult) && userResult.length > 0) {
        const user = userResult[0];
        customerInfo = {
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: user.phone
        };
      }
    } else {
      // Guest user
      if (!guestData) {
        return NextResponse.json({
          success: false,
          message: 'Guest data is required',
          error: 'Missing guest information'
        }, { status: 400 });
      }

      // Get delivery fee for guest address
      const [zoneResult] = await databaseService.query(
        'SELECT z.delivery_fee, c.name as city_name, z.name as zone_name FROM zones z JOIN cities c ON z.city_id = c.id WHERE z.id = ?',
        [guestData.zone]
      );

      if (Array.isArray(zoneResult) && zoneResult.length > 0) {
        const zone = zoneResult[0];
        deliveryFee = zone.delivery_fee;
        deliveryAddress = {
          street_address: guestData.address,
          additional_info: guestData.additionalInfo,
          city_name: zone.city_name,
          zone_name: zone.zone_name,
          delivery_fee: zone.delivery_fee
        };
      }

      customerInfo = {
        name: guestData.name,
        email: guestData.email,
        phone: guestData.phone
      };
    }

    if (!deliveryAddress) {
      return NextResponse.json({
        success: false,
        message: 'Delivery address is required',
        error: 'No valid delivery address provided'
      }, { status: 400 });
    }

    if (!customerInfo) {
      return NextResponse.json({
        success: false,
        message: 'Customer information is required',
        error: 'Missing customer information'
      }, { status: 400 });
    }

    const total = subtotal + deliveryFee;

    return NextResponse.json({
      success: true,
      message: 'Order confirmed successfully',
      data: {
        cart: {
          items,
          subtotal,
          deliveryFee,
          total,
          itemCount
        },
        deliveryAddress,
        customerInfo
      }
    });

  } catch (error) {
    console.error('Error confirming order:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to confirm order',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 