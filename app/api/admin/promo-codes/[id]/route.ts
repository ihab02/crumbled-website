import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';
import { databaseService } from '@/lib/services/databaseService';

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
    return NextResponse.json({ success: true, message: 'Promo code updated successfully' });
  } catch (error) {
    console.error('Error updating promo code:', error);
    return NextResponse.json(
      { error: 'Failed to update promo code' },
      { status: 500 }
    );
  }
} 