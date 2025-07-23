import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/admin/promo-code-usage?promo_code_id=123
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const promoCodeId = searchParams.get('promo_code_id');
    if (!promoCodeId) {
      return NextResponse.json({ error: 'promo_code_id is required' }, { status: 400 });
    }
    const [rows] = await db.execute(
      `SELECT 
        pcu.id,
        pcu.promo_code_id,
        pc.code AS promo_code,
        pcu.customer_id,
        c.email AS customer_email,
        pcu.usage_count,
        pcu.last_used_at
      FROM promo_code_usages pcu
      LEFT JOIN promo_codes pc ON pcu.promo_code_id = pc.id
      LEFT JOIN customers c ON pcu.customer_id = c.id
      WHERE pcu.promo_code_id = ?
      ORDER BY pcu.usage_count DESC, pcu.last_used_at DESC`,
      [promoCodeId]
    );
    // For now, guest usage is not tracked in this table
    return NextResponse.json({ data: rows, guestUsage: 0 });
  } catch (error) {
    console.error('Error fetching promo code usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 