import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// POST - Validate promo code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, customerId, cartItems, subtotal, customerEmail } = body;

    if (!code) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
    }

    // Fetch promo code details
    const [promoCodes] = await db.execute(
      'SELECT * FROM promo_codes WHERE code = ? AND is_active = 1',
      [code.toUpperCase()]
    );

    if ((promoCodes as any[]).length === 0) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid promo code' 
      });
    }

    const promoCode = (promoCodes as any[])[0];

    // Check if promo code is expired
    if (promoCode.valid_until && new Date() > new Date(promoCode.valid_until)) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Promo code has expired' 
      });
    }

    // Check usage limit
    if (promoCode.usage_limit && promoCode.used_count >= promoCode.usage_limit) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Promo code usage limit reached' 
      });
    }

    // Check minimum order amount
    if (promoCode.minimum_order_amount && subtotal < promoCode.minimum_order_amount) {
      return NextResponse.json({ 
        valid: false, 
        error: `Minimum order amount of ${promoCode.minimum_order_amount} EGP required` 
      });
    }

    // Determine per-user usage limit field
    const perUserLimit = promoCode.max_usage_per_user ?? promoCode.usage_per_customer ?? null;
    // Check per-user usage limit for registered users or guests
    let usageCount = 0;
    if (perUserLimit && (customerId || customerEmail)) {
      let usageRows;
      if (customerId) {
        [usageRows] = await db.execute(
          'SELECT usage_count FROM promo_code_usages WHERE promo_code_id = ? AND customer_id = ?',
          [promoCode.id, customerId]
        );
        usageCount = (usageRows as any[])[0]?.usage_count || 0;
      } else if (customerEmail) {
        // Guests are not stored in promo_code_usages. Approximate by counting orders placed
        // by a customer with this email that used this promo code.
        [usageRows] = await db.execute(
          `SELECT COALESCE(COUNT(o.id), 0) AS usage_count
           FROM orders o
           JOIN customers c ON o.customer_id = c.id
           WHERE o.promo_code_id = ? AND c.email = ?`,
          [promoCode.id, customerEmail]
        );
        usageCount = (usageRows as any[])[0]?.usage_count || 0;
      }
      if (usageCount >= perUserLimit) {
        return NextResponse.json({
          valid: false,
          error: `You have reached the usage limit for this promo code.`
        });
      }
    }

    // Enhanced validation based on promo code type
    let validationResult = { valid: true, discount: 0, message: '' };

    switch (promoCode.enhanced_type) {
      case 'first_time_customer':
        validationResult = await validateFirstTimeCustomer(promoCode, customerId, customerEmail);
        break;
      
      case 'buy_x_get_y':
        validationResult = await validateBuyXGetY(promoCode, cartItems);
        break;
      
      case 'category_specific':
        validationResult = await validateCategorySpecific(promoCode, cartItems);
        break;
      
      case 'free_delivery':
        validationResult = await validateFreeDelivery(promoCode, subtotal);
        break;
      
      case 'loyalty_reward':
        validationResult = await validateLoyaltyReward(promoCode, customerId);
        break;
      
      case 'basic':
      default: // fallback for any other types
        validationResult = await validateBasicPromo(promoCode, subtotal);
        break;
    }

    if (!validationResult.valid) {
      return NextResponse.json({ 
        valid: false, 
        error: validationResult.message 
      });
    }

    // Calculate discount amount and prepare enhanced response
    let discountAmount = 0;
    let freeDelivery = false;
    let eligibleItems = [];
    let buyXGetYDetails = null;
    
    if (promoCode.enhanced_type === 'free_delivery') {
      freeDelivery = true;
      // For free delivery, we don't apply a discount to subtotal
      // The delivery fee will be handled separately in the frontend
      discountAmount = 0;
    } else if (promoCode.enhanced_type === 'category_specific') {
      // Calculate discount only for eligible items
      try {
        const categoryRestrictions = promoCode.category_restrictions 
          ? JSON.parse(promoCode.category_restrictions) 
          : [];
        
        eligibleItems = cartItems.filter(item => {
          if (!categoryRestrictions.length) return true;
          return categoryRestrictions.some(category => 
            item.category === category || 
            item.flavors?.some(flavor => flavor.name.toLowerCase().includes(category.toLowerCase()))
          );
        });
        
        const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.price, 0);
        
        if (promoCode.discount_type === 'percentage') {
          discountAmount = (eligibleSubtotal * promoCode.discount_value) / 100;
          if (promoCode.maximum_discount) {
            discountAmount = Math.min(discountAmount, promoCode.maximum_discount);
          }
        } else if (promoCode.discount_type === 'fixed_amount') {
          discountAmount = Math.min(promoCode.discount_value, eligibleSubtotal);
        }
      } catch (error) {
        console.error('Error parsing category restrictions:', error);
        discountAmount = 0;
      }
    } else if (promoCode.enhanced_type === 'buy_x_get_y') {
      // For buy X get Y, calculate the discount based on the promotion
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const promotionCycles = Math.floor(totalQuantity / promoCode.buy_x_quantity);
      const freeItems = promotionCycles * promoCode.get_y_quantity;
      
      // Calculate average item price for discount calculation
      const averageItemPrice = subtotal / totalQuantity;
      discountAmount = freeItems * averageItemPrice * (promoCode.get_y_discount_percentage / 100);
      
      buyXGetYDetails = {
        buyX: promoCode.buy_x_quantity,
        getY: promoCode.get_y_quantity,
        discountPercentage: promoCode.get_y_discount_percentage,
        promotionCycles,
        freeItems
      };
    } else {
      // Basic percentage or fixed amount discount
      if (promoCode.discount_type === 'percentage') {
        discountAmount = (subtotal * promoCode.discount_value) / 100;
        if (promoCode.maximum_discount) {
          discountAmount = Math.min(discountAmount, promoCode.maximum_discount);
        }
      } else if (promoCode.discount_type === 'fixed_amount') {
        discountAmount = promoCode.discount_value;
      }
    }

    // On successful validation, do NOT increment usage here. Usage will be incremented on order placement.

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        name: promoCode.name,
        description: promoCode.description,
        discount_type: promoCode.discount_type,
        enhanced_type: promoCode.enhanced_type,
        discount_value: promoCode.discount_value,
        discount_amount: discountAmount,
        combination_allowed: promoCode.combination_allowed,
        stack_with_pricing_rules: promoCode.stack_with_pricing_rules,
        // Enhanced fields
        free_delivery: freeDelivery,
        eligible_items: eligibleItems,
        buy_x_get_y_details: buyXGetYDetails,
        category_restrictions: promoCode.category_restrictions,
        buy_x_quantity: promoCode.buy_x_quantity,
        get_y_quantity: promoCode.get_y_quantity,
        get_y_discount_percentage: promoCode.get_y_discount_percentage,
        minimum_order_amount: promoCode.minimum_order_amount
      },
      message: validationResult.message || 'Promo code applied successfully'
    });

  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Validation helper functions
async function validateFirstTimeCustomer(promoCode: any, customerId: string, customerEmail: string) {
  if (!customerId && !customerEmail) {
    return { valid: false, discount: 0, message: 'Customer information required for first-time customer promo' };
  }

  let query = '';
  let params: any[] = [];

  if (customerId) {
    query = 'SELECT COUNT(*) as order_count FROM orders WHERE customer_id = ?';
    params = [customerId];
  } else {
    query = 'SELECT COUNT(*) as order_count FROM orders o JOIN customers c ON o.customer_id = c.id WHERE c.email = ?';
    params = [customerEmail];
  }

  const [result] = await db.execute(query, params);
  const orderCount = (result as any)[0].order_count;

  if (orderCount > 0) {
    return { valid: false, discount: 0, message: 'This promo code is only for first-time customers' };
  }

  return { valid: true, discount: 0, message: 'First-time customer discount applied' };
}

async function validateBuyXGetY(promoCode: any, cartItems: any[]) {
  if (!promoCode.buy_x_quantity || !promoCode.get_y_quantity) {
    return { valid: false, discount: 0, message: 'Invalid buy X get Y configuration' };
  }

  // Check if cart has enough items for the promotion
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  if (totalQuantity < promoCode.buy_x_quantity) {
    return { 
      valid: false, 
      discount: 0,
      message: `Add ${promoCode.buy_x_quantity - totalQuantity} more items to qualify for this promotion` 
    };
  }

  return { valid: true, discount: 0, message: `Buy ${promoCode.buy_x_quantity} Get ${promoCode.get_y_quantity} promotion applied` };
}

async function validateCategorySpecific(promoCode: any, cartItems: any[]) {
  if (!promoCode.category_restrictions) {
    return { valid: true, discount: 0, message: 'Category-specific discount applied' };
  }

  const restrictions = JSON.parse(promoCode.category_restrictions);
  const hasEligibleItems = cartItems.some(item => {
    // Check if item matches category restrictions
    return restrictions.includes(item.category) || restrictions.includes(item.flavor);
  });

  if (!hasEligibleItems) {
    return { valid: false, discount: 0, message: 'No eligible items in cart for this category-specific promotion' };
  }

  return { valid: true, discount: 0, message: 'Category-specific discount applied' };
}

async function validateFreeDelivery(promoCode: any, subtotal: number) {
  // Free delivery is always valid if minimum order amount is met
  return { valid: true, discount: 0, message: 'Free delivery applied' };
}

async function validateLoyaltyReward(promoCode: any, customerId: string) {
  if (!customerId) {
    return { valid: false, discount: 0, message: 'Customer login required for loyalty rewards' };
  }

  // Check if customer exists
  const [customer] = await db.execute(
    'SELECT id, email FROM customers WHERE id = ?',
    [customerId]
  );

  if ((customer as any[]).length === 0) {
    return { valid: false, discount: 0, message: 'Customer not found' };
  }

  // For now, if customer exists and is logged in, allow loyalty rewards
  // You can implement more sophisticated loyalty logic here later
  if (promoCode.customer_group_restrictions && promoCode.customer_group_restrictions !== 'null') {
    try {
      const restrictions = JSON.parse(promoCode.customer_group_restrictions);
      // If restrictions are specified, you can add logic here
      // For now, we'll allow all logged-in customers
    } catch (error) {
      // If JSON parsing fails, continue with basic validation
    }
  }

  return { valid: true, discount: 0, message: 'Loyalty reward applied' };
}

async function validateBasicPromo(promoCode: any, subtotal: number) {
  // Basic validation already done above
  return { valid: true, discount: 0, message: 'Promo code applied successfully' };
} 