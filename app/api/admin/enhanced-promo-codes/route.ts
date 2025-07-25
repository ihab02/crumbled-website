import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/middleware/auth';
import { databaseService } from '@/lib/services/databaseService';

const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

// GET - Fetch all enhanced promo codes
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const decoded = verifyJWT(token);
    
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const enhancedType = searchParams.get('enhanced_type') || '';
    const isActive = searchParams.get('is_active');

    const offset = (page - 1) * limit;



    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (code LIKE ? OR name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (enhancedType && enhancedType !== 'all') {
      whereClause += ' AND enhanced_type = ?';
      params.push(enhancedType);
    }

    if (isActive && isActive !== 'all') {
      whereClause += ' AND is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }



    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM promo_codes ${whereClause}`;
    const countResult = await databaseService.query(countQuery, params);
    const total = countResult[0].total;

    // Get promo codes with pagination
    const query = `
      SELECT 
        pc.*,
        au.username as created_by_name
      FROM promo_codes pc
      LEFT JOIN admin_users au ON pc.created_by = au.id
      ${whereClause}
      ORDER BY pc.created_at DESC
      LIMIT ${Number(offset)}, ${Number(limit)}
    `;
    
    console.log('🔍 [DEBUG] Enhanced Promo Codes - Final query:', query);
    console.log('🔍 [DEBUG] Enhanced Promo Codes - WHERE clause:', whereClause);

    // Debug logging to see what's happening
    const finalParams = params || [];
    console.log('🔍 [DEBUG] Enhanced Promo Codes - Final params array:', finalParams);
    console.log('🔍 [DEBUG] Enhanced Promo Codes - Params length:', finalParams.length);
    console.log('🔍 [DEBUG] Enhanced Promo Codes - Limit:', Number(limit), 'Offset:', Number(offset));
    
    const promoCodes = await databaseService.query(query, finalParams);

    // Map fields for frontend compatibility
    const mappedPromoCodes = promoCodes.map((pc) => ({
      ...pc,
      usage_per_customer: pc.max_usage_per_user || pc.usage_per_customer || 1,
      // All other enhanced fields should already exist in the database
    }));

    return NextResponse.json({
      data: mappedPromoCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching enhanced promo codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new enhanced promo code
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const decoded = verifyJWT(token);
    
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    if (DEBUG) console.debug('[DEBUG] Enhanced PromoCode POST payload:', body);
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
      usage_per_order
    } = body;

    // Validate required fields
    if (!code || !name || !enhanced_type) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name, and enhanced_type are required' },
        { status: 400 }
      );
    }

    // For free delivery promos, discount_type and discount_value are not needed
    if (enhanced_type !== 'free_delivery' && (!discount_type || discount_value === undefined)) {
      return NextResponse.json(
        { error: 'Missing required fields: discount_type and discount_value are required for non-free-delivery promos' },
        { status: 400 }
      );
    }

    // Check if promo code already exists
    const existingCode = await databaseService.query(
      'SELECT id FROM promo_codes WHERE code = ?',
      [code]
    );

    if (existingCode.length > 0) {
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 400 }
      );
    }

    // Insert new promo code
    const insertQuery = `
      INSERT INTO promo_codes (
        code, name, description, discount_type, enhanced_type, discount_value,
        minimum_order_amount, maximum_discount, usage_limit, valid_until, is_active,
        category_restrictions, product_restrictions, customer_group_restrictions,
        first_time_only, minimum_quantity, maximum_quantity, combination_allowed,
        stack_with_pricing_rules, buy_x_quantity, get_y_quantity,
        get_y_discount_percentage, usage_per_customer, usage_per_order, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await databaseService.query(insertQuery, [
      code, name, description, 
      enhanced_type === 'free_delivery' ? 'percentage' : discount_type, // Default to percentage for free delivery
      enhanced_type, 
      enhanced_type === 'free_delivery' ? 0 : discount_value, // Default to 0 for free delivery
      minimum_order_amount || 0, maximum_discount, usage_limit, 
      valid_until && valid_until.trim() !== '' ? valid_until : null, // Convert empty string to null
      is_active !== false,
      JSON.stringify(category_restrictions), JSON.stringify(product_restrictions),
      JSON.stringify(customer_group_restrictions), first_time_only || false,
      minimum_quantity, maximum_quantity, combination_allowed !== false,
      stack_with_pricing_rules !== false, buy_x_quantity, get_y_quantity,
      get_y_discount_percentage, usage_per_customer || 1, usage_per_order || 1,
      decoded.id
    ]);

    if (DEBUG) console.debug('[DEBUG] Enhanced PromoCode created, insertId:', (result as any).insertId);

    const promoCodeId = result.insertId;

    // Fetch the created promo code
    const newPromoCode = await databaseService.query(
      'SELECT * FROM promo_codes WHERE id = ?',
      [promoCodeId]
    );

    return NextResponse.json({
      message: 'Enhanced promo code created successfully',
      data: newPromoCode[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating enhanced promo code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 