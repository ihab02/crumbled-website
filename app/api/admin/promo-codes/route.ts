import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verifyJWT(adminToken, 'admin');
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const promoCodes = await databaseService.query(`
      SELECT 
        pc.*,
        au.username as created_by_name
      FROM promo_codes pc
      LEFT JOIN admin_users au ON pc.created_by = au.id
      ORDER BY pc.created_at DESC
    `);

    // Map max_usage_per_user to usage_per_customer for frontend compatibility
    const mappedPromoCodes = promoCodes.map((pc: any) => ({
      ...pc,
      usage_per_customer: pc.max_usage_per_user
    }));

    return NextResponse.json({
      success: true,
      promoCodes: mappedPromoCodes
    });

  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verifyJWT(adminToken, 'admin');
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      code,
      name,
      description,
      discount_type,
      discount_value,
      minimum_order_amount,
      maximum_discount,
      usage_limit,
      valid_until,
      is_active,
      usage_per_customer // new field
    } = await request.json();

    // Validate required fields
    if (!code || !name || !discount_type || !discount_value) {
      return NextResponse.json(
        { error: 'Code, name, discount type, and discount value are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCode = await databaseService.query(
      'SELECT id FROM promo_codes WHERE code = ?',
      [code.toUpperCase()]
    );

    if (existingCode && existingCode.length > 0) {
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 400 }
      );
    }

    // Insert new promo code
    const result = await databaseService.query(`
      INSERT INTO promo_codes (
        code,
        name,
        description,
        discount_type,
        discount_value,
        minimum_order_amount,
        maximum_discount,
        usage_limit,
        max_usage_per_user,
        valid_until,
        is_active,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code.toUpperCase(),
      name,
      description,
      discount_type,
      discount_value,
      minimum_order_amount || 0,
      maximum_discount || null,
      usage_limit || null,
      usage_per_customer || null,
      valid_until || null,
      is_active,
      decoded.id
    ]);

    const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
    if (DEBUG) console.debug('[DEBUG] PromoCode POST payload:', { code, name, discount_type, discount_value });
    if (DEBUG) console.debug('[DEBUG] PromoCode created, insertId:', result.insertId);

    return NextResponse.json({
      success: true,
      message: 'Promo code created successfully',
      promoCodeId: result.insertId
    });

  } catch (error) {
    console.error('Error creating promo code:', error);
    return NextResponse.json(
      { error: 'Failed to create promo code' },
      { status: 500 }
    );
  }
} 

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let decoded;
    try {
      decoded = verifyJWT(adminToken, 'admin');
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const id = params.id;
    const {
      code,
      name,
      description,
      discount_type,
      discount_value,
      minimum_order_amount,
      maximum_discount,
      usage_limit,
      valid_until,
      is_active,
      usage_per_customer // new field
    } = await request.json();
    // Update promo code
    await databaseService.query(`
      UPDATE promo_codes SET
        code = ?,
        name = ?,
        description = ?,
        discount_type = ?,
        discount_value = ?,
        minimum_order_amount = ?,
        maximum_discount = ?,
        usage_limit = ?,
        max_usage_per_user = ?,
        valid_until = ?,
        is_active = ?
      WHERE id = ?
    `, [
      code.toUpperCase(),
      name,
      description,
      discount_type,
      discount_value,
      minimum_order_amount || 0,
      maximum_discount || null,
      usage_limit || null,
      usage_per_customer || null,
      valid_until || null,
      is_active,
      id
    ]);
    const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
    if (DEBUG) console.debug('[DEBUG] PromoCode PUT payload:', { code, name, discount_type, discount_value });
    if (DEBUG) console.debug('[DEBUG] PromoCode updated, id:', id);
    return NextResponse.json({ success: true, message: 'Promo code updated successfully' });
  } catch (error) {
    console.error('Error updating promo code:', error);
    return NextResponse.json(
      { error: 'Failed to update promo code' },
      { status: 500 }
    );
  }
} 