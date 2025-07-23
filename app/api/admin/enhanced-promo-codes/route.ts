import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/middleware/auth';
import db from '@/lib/db';

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

    if (enhancedType) {
      whereClause += ' AND enhanced_type = ?';
      params.push(enhancedType);
    }

    if (isActive !== null && isActive !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM promo_codes ${whereClause}`;
    const [countResult] = await db.execute(countQuery, params);
    const total = (countResult as any)[0].total;

    // Get promo codes with pagination
    const query = `
      SELECT 
        pc.*,
        au.name as created_by_name
      FROM promo_codes pc
      LEFT JOIN admin_users au ON pc.created_by = au.id
      ${whereClause}
      ORDER BY pc.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [promoCodes] = await db.execute(query, [...params, limit, offset]);

    // Map max_usage_per_user to usage_per_customer for frontend compatibility
    const mappedPromoCodes = (promoCodes as any[]).map((pc) => ({
      ...pc,
      usage_per_customer: pc.max_usage_per_user
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
    if (!code || !name || !discount_type || !enhanced_type || !discount_value) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if promo code already exists
    const [existingCode] = await db.execute(
      'SELECT id FROM promo_codes WHERE code = ?',
      [code]
    );

    if ((existingCode as any[]).length > 0) {
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

    const [result] = await db.execute(insertQuery, [
      code, name, description, discount_type, enhanced_type, discount_value,
      minimum_order_amount || 0, maximum_discount, usage_limit, valid_until, is_active !== false,
      JSON.stringify(category_restrictions), JSON.stringify(product_restrictions),
      JSON.stringify(customer_group_restrictions), first_time_only || false,
      minimum_quantity, maximum_quantity, combination_allowed !== false,
      stack_with_pricing_rules !== false, buy_x_quantity, get_y_quantity,
      get_y_discount_percentage, usage_per_customer || 1, usage_per_order || 1,
      decoded.id
    ]);

    if (DEBUG) console.debug('[DEBUG] Enhanced PromoCode created, insertId:', (result as any).insertId);

    const promoCodeId = (result as any).insertId;

    // Fetch the created promo code
    const [newPromoCode] = await db.execute(
      'SELECT * FROM promo_codes WHERE id = ?',
      [promoCodeId]
    );

    return NextResponse.json({
      message: 'Enhanced promo code created successfully',
      data: (newPromoCode as any[])[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating enhanced promo code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 