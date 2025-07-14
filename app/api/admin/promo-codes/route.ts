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
        au.name as created_by_name
      FROM promo_codes pc
      LEFT JOIN admin_users au ON pc.created_by = au.id
      ORDER BY pc.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      promoCodes
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
      is_active
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
        valid_until,
        is_active,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code.toUpperCase(),
      name,
      description,
      discount_type,
      discount_value,
      minimum_order_amount || 0,
      maximum_discount || null,
      usage_limit || null,
      valid_until || null,
      is_active,
      decoded.id
    ]);

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