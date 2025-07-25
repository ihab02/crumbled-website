import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/middleware/auth';
import db from '@/lib/db';

// GET - Fetch single pricing rule
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

    const pricingRuleId = parseInt(params.id);
    if (isNaN(pricingRuleId)) {
      return NextResponse.json({ error: 'Invalid pricing rule ID' }, { status: 400 });
    }

    const [pricingRule] = await db.execute(
      `SELECT 
        pr.*,
        au.username as created_by_name
      FROM pricing_rules pr
      LEFT JOIN admin_users au ON pr.created_by = au.id
      WHERE pr.id = ?`,
      [pricingRuleId]
    );

    if ((pricingRule as any[]).length === 0) {
      return NextResponse.json({ error: 'Pricing rule not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: (pricingRule as any[])[0]
    });

  } catch (error) {
    console.error('Error fetching pricing rule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update pricing rule
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

    const pricingRuleId = parseInt(params.id);
    if (isNaN(pricingRuleId)) {
      return NextResponse.json({ error: 'Invalid pricing rule ID' }, { status: 400 });
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

    // Check if pricing rule exists
    const [existingRule] = await db.execute(
      'SELECT id FROM pricing_rules WHERE id = ?',
      [pricingRuleId]
    );

    if ((existingRule as any[]).length === 0) {
      return NextResponse.json({ error: 'Pricing rule not found' }, { status: 404 });
    }

    // Update pricing rule
    const updateQuery = `
      UPDATE pricing_rules SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        rule_type = COALESCE(?, rule_type),
        target_id = COALESCE(?, target_id),
        target_value = COALESCE(?, target_value),
        discount_type = COALESCE(?, discount_type),
        discount_value = COALESCE(?, discount_value),
        minimum_order_amount = COALESCE(?, minimum_order_amount),
        maximum_discount = COALESCE(?, maximum_discount),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        is_active = COALESCE(?, is_active),
        priority = COALESCE(?, priority),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await db.execute(updateQuery, [
      name, description, rule_type, target_id, target_value, discount_type,
      discount_value, minimum_order_amount, maximum_discount, start_date,
      end_date, is_active, priority, pricingRuleId
    ]);

    // Fetch the updated pricing rule
    const [updatedPricingRule] = await db.execute(
      'SELECT * FROM pricing_rules WHERE id = ?',
      [pricingRuleId]
    );

    return NextResponse.json({
      message: 'Pricing rule updated successfully',
      data: (updatedPricingRule as any[])[0]
    });

  } catch (error) {
    console.error('Error updating pricing rule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete pricing rule
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

    const pricingRuleId = parseInt(params.id);
    if (isNaN(pricingRuleId)) {
      return NextResponse.json({ error: 'Invalid pricing rule ID' }, { status: 400 });
    }

    // Check if pricing rule exists
    const [existingRule] = await db.execute(
      'SELECT id FROM pricing_rules WHERE id = ?',
      [pricingRuleId]
    );

    if ((existingRule as any[]).length === 0) {
      return NextResponse.json({ error: 'Pricing rule not found' }, { status: 404 });
    }

    // Delete pricing rule
    await db.execute(
      'DELETE FROM pricing_rules WHERE id = ?',
      [pricingRuleId]
    );

    return NextResponse.json({
      message: 'Pricing rule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 