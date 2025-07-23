import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/middleware/auth';
import db from '@/lib/db';

// GET - Fetch all pricing rules
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
    const ruleType = searchParams.get('rule_type') || '';
    const isActive = searchParams.get('is_active');

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (ruleType) {
      whereClause += ' AND rule_type = ?';
      params.push(ruleType);
    }

    if (isActive !== null && isActive !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM pricing_rules ${whereClause}`;
    const [countResult] = await db.execute(countQuery, params);
    const total = (countResult as any)[0].total;

    // Get pricing rules with pagination
    const query = `
      SELECT 
        pr.*,
        au.name as created_by_name
      FROM pricing_rules pr
      LEFT JOIN admin_users au ON pr.created_by = au.id
      ${whereClause}
      ORDER BY pr.priority ASC, pr.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [pricingRules] = await db.execute(query, [...params, limit, offset]);

    return NextResponse.json({
      data: pricingRules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new pricing rule
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
    const {
      name,
      description,
      rule_type,
      target_id,
      target_value,
      discount_type,
      discount_value,
      minimum_order_amount,
      maximum_discount,
      start_date,
      end_date,
      is_active,
      priority
    } = body;

    // Validate required fields
    if (!name || !rule_type || !discount_type || !discount_value) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert new pricing rule
    const insertQuery = `
      INSERT INTO pricing_rules (
        name, description, rule_type, target_id, target_value, discount_type,
        discount_value, minimum_order_amount, maximum_discount, start_date,
        end_date, is_active, priority, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(insertQuery, [
      name, description, rule_type, target_id, target_value, discount_type,
      discount_value, minimum_order_amount || 0, maximum_discount, start_date,
      end_date, is_active !== false, priority || 0, decoded.id
    ]);

    const pricingRuleId = (result as any).insertId;

    // Fetch the created pricing rule
    const [newPricingRule] = await db.execute(
      'SELECT * FROM pricing_rules WHERE id = ?',
      [pricingRuleId]
    );

    return NextResponse.json({
      message: 'Pricing rule created successfully',
      data: (newPricingRule as any[])[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating pricing rule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 