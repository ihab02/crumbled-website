import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/middleware/auth';
import db from '@/lib/db';

// GET - Fetch single enhanced promo code
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const decoded = verifyJWT(token);
    
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const promoCodeId = parseInt(params.id);
    if (isNaN(promoCodeId)) {
      return NextResponse.json({ error: 'Invalid promo code ID' }, { status: 400 });
    }

    const [promoCode] = await db.execute(
      `SELECT 
        pc.*,
        au.username as created_by_name
      FROM promo_codes pc
      LEFT JOIN admin_users au ON pc.created_by = au.id
      WHERE pc.id = ?`,
      [promoCodeId]
    );

    if ((promoCode as any[]).length === 0) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: (promoCode as any[])[0]
    });

  } catch (error) {
    console.error('Error fetching enhanced promo code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update enhanced promo code
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const decoded = verifyJWT(token);
    
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const promoCodeId = parseInt(params.id);
    if (isNaN(promoCodeId)) {
      return NextResponse.json({ error: 'Invalid promo code ID' }, { status: 400 });
    }

    const body = await request.json();
    console.log('🔍 [DEBUG] Enhanced Promo Code Update - Request body:', JSON.stringify(body, null, 2));
    
    const {
      code,
      name,
      description,
      discount_type,
      enhanced_type,
      discount_value,
      minimum_order_amount,
      maximum_discount,
      usage_limit,
      valid_until,
      is_active,
      category_restrictions,
      product_restrictions,
      customer_group_restrictions,
      first_time_only,
      minimum_quantity,
      maximum_quantity,
      combination_allowed,
      stack_with_pricing_rules,
      buy_x_quantity,
      get_y_quantity,
      get_y_discount_percentage,
      usage_per_customer,
      usage_per_order,
      max_usage_per_user
    } = body;

    // Validate required fields
    if (name !== undefined && !name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (enhanced_type !== undefined && !enhanced_type) {
      return NextResponse.json(
        { error: 'Enhanced type is required' },
        { status: 400 }
      );
    }

    // For free delivery promos, discount_type and discount_value are not needed
    if (enhanced_type !== undefined && enhanced_type !== 'free_delivery' && 
        ((discount_type !== undefined && !discount_type) || 
         (discount_value !== undefined && discount_value === null))) {
      return NextResponse.json(
        { error: 'Discount type and discount value are required for non-free-delivery promos' },
        { status: 400 }
      );
    }

    // Check if promo code exists
    const [existingCode] = await db.execute(
      'SELECT id FROM promo_codes WHERE id = ?',
      [promoCodeId]
    );

    if ((existingCode as any[]).length === 0) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
    }

    // Check if new code already exists (if code is being changed)
    if (code) {
      const [duplicateCode] = await db.execute(
        'SELECT id FROM promo_codes WHERE code = ? AND id != ?',
        [code, promoCodeId]
      );

      if ((duplicateCode as any[]).length > 0) {
        return NextResponse.json(
          { error: 'Promo code already exists' },
          { status: 400 }
        );
      }
    }

    // Helper function to safely JSON.stringify only if needed
    const safeJsonStringify = (value: any) => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'string') {
        // Handle empty strings - return null for JSON columns
        if (value.trim() === '') {
          return null;
        }
        // If it's already a JSON string, return as is
        try {
          JSON.parse(value);
          return value;
        } catch {
          // If it's not valid JSON, stringify it
          return JSON.stringify(value);
        }
      }
      if (Array.isArray(value) || typeof value === 'object') {
        return JSON.stringify(value);
      }
      return value;
    };

    // Prepare parameters for the update query
    const usagePerCustomer = body.max_usage_per_user !== undefined ? body.max_usage_per_user : usage_per_customer;
    const updateParams = [
      code, name, description, 
      enhanced_type === 'free_delivery' ? 'percentage' : discount_type, // Default to percentage for free delivery
      enhanced_type, 
      enhanced_type === 'free_delivery' ? 0 : discount_value, // Default to 0 for free delivery
      minimum_order_amount, maximum_discount, usage_limit, 
      valid_until && valid_until.trim() !== '' ? valid_until : null, // Convert empty string to null
      is_active,
      safeJsonStringify(category_restrictions), 
      safeJsonStringify(product_restrictions),
      safeJsonStringify(customer_group_restrictions), 
      first_time_only,
      minimum_quantity, maximum_quantity, combination_allowed,
      stack_with_pricing_rules, buy_x_quantity, get_y_quantity,
      get_y_discount_percentage, usagePerCustomer, usage_per_order,
      usagePerCustomer, // <-- for max_usage_per_user
      promoCodeId
    ];

    console.log('🔍 [DEBUG] Enhanced Promo Code Update - Update params:', JSON.stringify(updateParams, null, 2));

    // Update promo code
    const updateQuery = `
      UPDATE promo_codes SET
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        discount_type = COALESCE(?, discount_type),
        enhanced_type = COALESCE(?, enhanced_type),
        discount_value = COALESCE(?, discount_value),
        minimum_order_amount = COALESCE(?, minimum_order_amount),
        maximum_discount = COALESCE(?, maximum_discount),
        usage_limit = COALESCE(?, usage_limit),
        valid_until = COALESCE(?, valid_until),
        is_active = COALESCE(?, is_active),
        category_restrictions = COALESCE(?, category_restrictions),
        product_restrictions = COALESCE(?, product_restrictions),
        customer_group_restrictions = COALESCE(?, customer_group_restrictions),
        first_time_only = COALESCE(?, first_time_only),
        minimum_quantity = COALESCE(?, minimum_quantity),
        maximum_quantity = COALESCE(?, maximum_quantity),
        combination_allowed = COALESCE(?, combination_allowed),
        stack_with_pricing_rules = COALESCE(?, stack_with_pricing_rules),
        buy_x_quantity = COALESCE(?, buy_x_quantity),
        get_y_quantity = COALESCE(?, get_y_quantity),
        get_y_discount_percentage = COALESCE(?, get_y_discount_percentage),
        usage_per_customer = COALESCE(?, usage_per_customer),
        usage_per_order = COALESCE(?, usage_per_order),
        max_usage_per_user = COALESCE(?, max_usage_per_user),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    console.log('🔍 [DEBUG] Enhanced Promo Code Update - SQL Query:', updateQuery);

    await db.execute(updateQuery, updateParams);

    // Fetch the updated promo code
    const [updatedPromoCode] = await db.execute(
      'SELECT * FROM promo_codes WHERE id = ?',
      [promoCodeId]
    );

    console.log('🔍 [DEBUG] Enhanced Promo Code Update - Updated promo code:', JSON.stringify((updatedPromoCode as any[])[0], null, 2));

    return NextResponse.json({
      message: 'Enhanced promo code updated successfully',
      data: (updatedPromoCode as any[])[0]
    });

  } catch (error) {
    console.error('Error updating enhanced promo code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete enhanced promo code
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const decoded = verifyJWT(token);
    
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const promoCodeId = parseInt(params.id);
    if (isNaN(promoCodeId)) {
      return NextResponse.json({ error: 'Invalid promo code ID' }, { status: 400 });
    }

    // Check if promo code exists
    const [existingCode] = await db.execute(
      'SELECT id FROM promo_codes WHERE id = ?',
      [promoCodeId]
    );

    if ((existingCode as any[]).length === 0) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
    }

    // Delete promo code
    await db.execute(
      'DELETE FROM promo_codes WHERE id = ?',
      [promoCodeId]
    );

    return NextResponse.json({
      message: 'Enhanced promo code deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting enhanced promo code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 