import { NextResponse } from "next/server"
import pool from '@/lib/db'

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM flavors');
    return NextResponse.json({ success: true, count: rows[0].count });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 