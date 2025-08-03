import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';
import { orderModeService } from '@/lib/services/orderModeService';

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
  guest?: {
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
  saveNewAddress?: boolean;
  deliveryDate?: string;
  deliveryTimeSlot?: {
    name: string;
    fromHour: string;
    toHour: string;
  };
  promoCode?: {
    id: number;
    code: string;
    discount_amount: number;
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
    const requestBody = await request.json() as CheckoutConfirmRequest;
    
    // Handle both field names for backward compatibility
    const guestData = requestBody.guestData || requestBody.guest;
    const { selectedAddressId, useNewAddress, newAddress, saveNewAddress, deliveryDate } = requestBody;
    
    console.log('🔍 [DEBUG] Confirm API - Request body:', JSON.stringify(requestBody, null, 2))
    console.log('🔍 [DEBUG] Confirm API - Guest data:', JSON.stringify(guestData, null, 2))
    console.log('🔍 [DEBUG] Confirm API - Save New Address:', saveNewAddress)
    
    const cartId = await getOrCreateCart();

    console.log('🔍 [DEBUG] Confirm API - Session:', session?.user?.email)
    console.log('🔍 [DEBUG] Confirm API - Selected Address ID:', selectedAddressId)
    console.log('🔍 [DEBUG] Confirm API - Use New Address:', useNewAddress)
    console.log('🔍 [DEBUG] Confirm API - Delivery Date:', deliveryDate)
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
    // Fetch and validate cart items - using the same query structure as cart API
    const cartResult = await databaseService.query(
      `SELECT 
        ci.id,
        ci.quantity,
        ci.product_id,
        p.name as product_name,
        p.is_pack,
        p.base_price,
        p.flavor_size as size,
        p.image_url,
        p.count,
        p.stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ? AND p.is_active = true
       ORDER BY ci.id DESC`,
      [cartId]
    );

    console.log('🔍 [DEBUG] Confirm API - Cart result:', cartResult)

    // Handle both array and single object results like cart API does
    const cartItemsArray = Array.isArray(cartResult) ? cartResult : (cartResult ? [cartResult] : []);

    if (cartItemsArray.length === 0) {
      console.error('❌ [DEBUG] Confirm API - Cart is empty')
      return NextResponse.json({
        success: false,
        message: 'Cart is empty',
        error: 'No items found in cart'
      }, { status: 400 });
    }

    // Check stock availability using order mode service
    console.log('🔍 [DEBUG] Confirm API - Checking cart availability with order mode service')
    
    // Prepare cart items for availability check
    const cartItemsForCheck = await Promise.all(cartItemsArray.map(async (item: any) => {
      let flavors: Array<{ id: number; quantity: number; name?: string }> = [];
      
      // Fetch flavors for pack items
      if (item.is_pack) {
        const flavorResult = await databaseService.query(
          'SELECT f.id, f.name, cif.quantity FROM cart_item_flavors cif JOIN flavors f ON cif.flavor_id = f.id WHERE cif.cart_item_id = ?',
          [item.id]
        );
        
        if (Array.isArray(flavorResult)) {
          flavors = flavorResult.map((flavor: any) => ({
            id: flavor.id,
            name: flavor.name,
            quantity: flavor.quantity
          }));
        }
      }
      
      return {
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        isPack: item.is_pack,
        packSize: item.size,
        productName: item.product_name,
        flavors
      };
    }));

    const availabilityCheck = await orderModeService.checkCartAvailability(cartItemsForCheck);
    
    console.log('🔍 [DEBUG] Confirm API - Availability check result:', availabilityCheck);

    if (!availabilityCheck.isAvailable) {
      // Build a detailed error message with specific item names
      let errorMessage = 'Some items in your cart are currently out of stock:\n\n';
      
      if (availabilityCheck.outOfStockItems && availabilityCheck.outOfStockItems.length > 0) {
        const productItems = availabilityCheck.outOfStockItems.filter(item => item.type === 'product');
        const flavorItems = availabilityCheck.outOfStockItems.filter(item => item.type === 'flavor');
        
        if (productItems.length > 0) {
          errorMessage += '**Products out of stock:**\n';
          for (const item of productItems) {
            // Find the actual product name from cart items
            const cartItem = cartItemsArray.find(ci => ci.product_id === item.id);
            const productName = cartItem ? cartItem.product_name : `Product ${item.id}`;
            errorMessage += `• ${productName} (${item.requestedQuantity} requested, ${item.availableQuantity} available)\n`;
          }
          errorMessage += '\n';
        }
        
        if (flavorItems.length > 0) {
          errorMessage += '**Flavors out of stock:**\n';
          // Get all flavor IDs to fetch names in batch
          const flavorIds = flavorItems.map(item => item.id);
          const flavorResult = await databaseService.query(
            `SELECT id, name FROM flavors WHERE id IN (${flavorIds.join(',')})`
          );
          
          if (Array.isArray(flavorResult)) {
            for (const item of flavorItems) {
              const flavor = flavorResult.find(f => f.id === item.id);
              const flavorName = flavor ? flavor.name : `Flavor ${item.id}`;
              errorMessage += `• ${flavorName} (${item.requestedQuantity} requested, ${item.availableQuantity} available)\n`;
            }
          } else {
            // Fallback if batch query fails
            for (const item of flavorItems) {
              errorMessage += `• Flavor ${item.id} (${item.requestedQuantity} requested, ${item.availableQuantity} available)\n`;
            }
          }
          errorMessage += '\n';
        }
        
        errorMessage += 'Please remove these items from your cart or contact us for availability updates.';
      } else {
        errorMessage = 'Some items are not available for ordering. Please check your cart and try again.';
      }

      return NextResponse.json({
        success: false,
        message: 'Items out of stock',
        error: errorMessage,
        outOfStockItems: availabilityCheck.outOfStockItems
      }, { status: 400 });
    }

    // Process cart items with flavors
    const items = await Promise.all(cartItemsArray.map(async (item: any) => {
      let flavors: Array<{
        id: number;
        name: string;
        quantity: number;
        price: number;
        size: string;
      }> = [];

      // Fetch flavors for pack items
      if (item.is_pack) {
        const flavorResult = await databaseService.query(
          `SELECT 
            f.id, 
            f.name, 
            cif.quantity,
            f.mini_price,
            f.medium_price,
            f.large_price
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
            price: item.size === 'Large' ? flavor.large_price : 
                   item.size === 'Medium' ? flavor.medium_price : flavor.mini_price,
            size: item.size
          }));
        }
      }

      // Calculate total for this item
      const baseTotal = item.base_price * item.quantity;
      const flavorTotal = flavors.reduce((sum, flavor) => sum + (flavor.price * flavor.quantity), 0);
      const total = baseTotal + flavorTotal;

      console.log(`🔍 [DEBUG] Confirm API - Item ${item.id} total calculation:`)
      console.log(`  - Base price: ${item.base_price}`)
      console.log(`  - Quantity: ${item.quantity}`)
      console.log(`  - Base total: ${baseTotal}`)
      console.log(`  - Flavors:`, flavors.map(f => `${f.name} (${f.price} x ${f.quantity} = ${f.price * f.quantity})`))
      console.log(`  - Flavor total: ${flavorTotal}`)
      console.log(`  - Final total: ${total}`)

      return {
        id: item.id,
        name: item.product_name,
        basePrice: item.base_price,
        quantity: item.quantity,
        isPack: item.is_pack,
        packSize: item.size,
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
        const zoneResult = await databaseService.query(
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

        // Save new address if requested
        if (saveNewAddress && newAddress) {
          console.log('🔍 [DEBUG] Confirm API - Saving new address for user:', session.user.email)
          
          // Get customer ID
          const customerResult = await databaseService.query(
            'SELECT id FROM customers WHERE email = ?',
            [session.user.email]
          );
          
          const customerArray = Array.isArray(customerResult) ? customerResult : (customerResult ? [customerResult] : []);
          
          if (customerArray.length > 0) {
            const customerId = customerArray[0].id;
            
            // Check if this address already exists for this customer
            const existingAddressResult = await databaseService.query(
              `SELECT id FROM customer_addresses 
               WHERE customer_id = ? 
               AND street_address = ? 
               AND city_id = ? 
               AND zone_id = ? 
               AND (additional_info = ? OR (additional_info IS NULL AND ? IS NULL))`,
              [
                customerId,
                newAddress.street_address,
                newAddress.city_id,
                newAddress.zone_id,
                newAddress.additional_info || null,
                newAddress.additional_info || null
              ]
            );
            
            const existingAddressArray = Array.isArray(existingAddressResult) ? existingAddressResult : (existingAddressResult ? [existingAddressResult] : []);
            
            if (existingAddressArray.length === 0) {
              // Address doesn't exist, save it
              const insertResult = await databaseService.query(
                'INSERT INTO customer_addresses (customer_id, street_address, additional_info, city_id, zone_id, is_default) VALUES (?, ?, ?, ?, ?, ?)',
                [
                  customerId,
                  newAddress.street_address,
                  newAddress.additional_info || null,
                  newAddress.city_id,
                  newAddress.zone_id,
                  false // Don't set as default automatically
                ]
              );
              
              console.log('🔍 [DEBUG] Confirm API - New address saved with ID:', (insertResult as any).insertId)
            } else {
              console.log('🔍 [DEBUG] Confirm API - Address already exists, skipping save')
            }
          } else {
            console.error('❌ [DEBUG] Confirm API - Customer not found for email:', session.user.email)
          }
        }
      } else if (selectedAddressId) {
        // Use selected saved address
        console.log('🔍 [DEBUG] Confirm API - Looking up saved address ID:', selectedAddressId)
        console.log('🔍 [DEBUG] Confirm API - User email:', session.user.email)
        
        const addressResult = await databaseService.query(
          `SELECT ca.street_address, ca.additional_info, c.name as city_name, z.name as zone_name, z.delivery_fee
           FROM customer_addresses ca
           JOIN cities c ON ca.city_id = c.id
           JOIN zones z ON ca.zone_id = z.id
           WHERE ca.id = ? AND ca.customer_id = (SELECT id FROM customers WHERE email = ?)`,
          [selectedAddressId, session.user.email]
        );

        console.log('🔍 [DEBUG] Confirm API - Address lookup result:', addressResult)

        // Handle both array and single object results
        const addressArray = Array.isArray(addressResult) ? addressResult : (addressResult ? [addressResult] : []);

        if (addressArray.length > 0) {
          const address = addressArray[0];
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
      console.log('🔍 [DEBUG] Confirm API - Looking up customer info for email:', session.user.email)
      const userResult = await databaseService.query(
        'SELECT first_name, last_name, email, phone FROM customers WHERE email = ?',
        [session.user.email]
      );

      console.log('🔍 [DEBUG] Confirm API - Customer lookup result:', userResult)

      // Handle both array and single object results
      const userArray = Array.isArray(userResult) ? userResult : (userResult ? [userResult] : []);

      if (userArray.length > 0) {
        const user = userArray[0];
        customerInfo = {
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: user.phone
        };
        console.log('🔍 [DEBUG] Confirm API - Customer info set:', customerInfo)
      } else {
        console.error('❌ [DEBUG] Confirm API - No customer found for email:', session.user.email)
      }
    } else {
      // Guest user
      console.log('🔍 [DEBUG] Confirm API - Processing guest user')
      if (!guestData) {
        console.error('❌ [DEBUG] Confirm API - No guest data provided')
        return NextResponse.json({
          success: false,
          message: 'Guest data is required',
          error: 'Missing guest information'
        }, { status: 400 });
      }

      console.log('🔍 [DEBUG] Confirm API - Guest data received:', JSON.stringify(guestData, null, 2))

      // Convert zone to number if it's a string
      const zoneId = typeof guestData.zone === 'string' ? parseInt(guestData.zone, 10) : guestData.zone;
      
      console.log('🔍 [DEBUG] Confirm API - Zone ID (original):', guestData.zone)
      console.log('🔍 [DEBUG] Confirm API - Zone ID (converted):', zoneId)
      
      if (isNaN(zoneId)) {
        console.error('❌ [DEBUG] Confirm API - Invalid zone ID:', guestData.zone)
        return NextResponse.json({
          success: false,
          message: 'Invalid zone ID',
          error: 'Zone ID must be a valid number'
        }, { status: 400 });
      }

      // Get delivery fee for guest address
      console.log('🔍 [DEBUG] Confirm API - Querying zone with ID:', zoneId)
      const zoneResult = await databaseService.query(
        'SELECT z.delivery_fee, c.name as city_name, z.name as zone_name FROM zones z JOIN cities c ON z.city_id = c.id WHERE z.id = ?',
        [zoneId]
      );

      console.log('🔍 [DEBUG] Confirm API - Zone query result:', zoneResult)

      // Handle both array and single object results
      const zoneArray = Array.isArray(zoneResult) ? zoneResult : (zoneResult ? [zoneResult] : []);

      if (zoneArray.length > 0) {
        const zone = zoneArray[0];
        deliveryFee = zone.delivery_fee;
        deliveryAddress = {
          street_address: guestData.address,
          additional_info: guestData.additionalInfo,
          city_name: zone.city_name,
          zone_name: zone.zone_name,
          delivery_fee: zone.delivery_fee
        };
        console.log('🔍 [DEBUG] Confirm API - Delivery address set:', deliveryAddress)
      } else {
        console.error('❌ [DEBUG] Confirm API - Zone not found for ID:', zoneId)
        return NextResponse.json({
          success: false,
          message: 'Invalid zone selected',
          error: 'Zone not found in database'
        }, { status: 400 });
      }

      customerInfo = {
        name: guestData.name,
        email: guestData.email,
        phone: guestData.phone
      };
      console.log('🔍 [DEBUG] Confirm API - Customer info set:', customerInfo)
    }

    if (!deliveryAddress) {
      console.error('❌ [DEBUG] Confirm API - No delivery address set')
      return NextResponse.json({
        success: false,
        message: 'Delivery address is required',
        error: 'No valid delivery address provided'
      }, { status: 400 });
    }

    if (!customerInfo) {
      console.error('❌ [DEBUG] Confirm API - No customer info set')
      return NextResponse.json({
        success: false,
        message: 'Customer information is required',
        error: 'Missing customer information'
      }, { status: 400 });
    }

    // Validate delivery date if provided
    if (deliveryDate) {
      const deliveryDateObj = new Date(deliveryDate);
      if (isNaN(deliveryDateObj.getTime())) {
        console.error('❌ [DEBUG] Confirm API - Invalid delivery date format:', deliveryDate)
        return NextResponse.json({
          success: false,
          message: 'Invalid delivery date format',
          error: 'Delivery date must be a valid date'
        }, { status: 400 });
      }
      
      // Check if delivery date is in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deliveryDateObj < today) {
        console.error('❌ [DEBUG] Confirm API - Delivery date is in the past:', deliveryDate)
        return NextResponse.json({
          success: false,
          message: 'Delivery date cannot be in the past',
          error: 'Please select a future delivery date'
        }, { status: 400 });
      }
    }

    console.log('🔍 [DEBUG] Confirm API - All validations passed, proceeding with order confirmation')

    const total = subtotal + Number(deliveryFee);

    console.log(`🔍 [DEBUG] Confirm API - Final calculations:`)
    console.log(`  - Subtotal: ${subtotal}`)
    console.log(`  - Delivery fee: ${deliveryFee}`)
    console.log(`  - Total: ${total}`)

    // Extract promo code info from request if present
    let promoCode = undefined;
    if ('promoCode' in requestBody && requestBody.promoCode && requestBody.promoCode.id) {
      promoCode = {
        id: requestBody.promoCode.id,
        code: requestBody.promoCode.code,
        discount_amount: requestBody.promoCode.discount_amount
      };
    }

    // Extract delivery time slot info from request if present
    let deliveryTimeSlot = undefined;
    if ('deliveryTimeSlot' in requestBody && requestBody.deliveryTimeSlot) {
      deliveryTimeSlot = {
        name: requestBody.deliveryTimeSlot.name,
        fromHour: requestBody.deliveryTimeSlot.fromHour,
        toHour: requestBody.deliveryTimeSlot.toHour
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Order confirmed successfully',
      data: {
        cart: {
          items,
          subtotal,
          deliveryFee: Number(deliveryFee),
          total,
          itemCount
        },
        deliveryAddress,
        customerInfo,
        deliveryDate,
        ...(deliveryTimeSlot ? { deliveryTimeSlot } : {}),
        ...(promoCode ? { promoCode } : {})
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