import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Create a connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Goodmorning@1',
  database: 'crumbled_nextDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// GET /api/admin/settings
export async function GET() {
  try {
    const [settings] = await pool.query('SELECT * FROM cart_settings LIMIT 1');
    
    return NextResponse.json({
      success: true,
      settings: settings[0]
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings
export async function POST(request: Request) {
  try {
    const { cart_lifetime_days } = await request.json();

    if (!cart_lifetime_days || cart_lifetime_days < 1 || cart_lifetime_days > 30) {
      return NextResponse.json(
        { success: false, error: 'Cart lifetime must be between 1 and 30 days' },
        { status: 400 }
      );
    }

    await pool.query(
      'UPDATE cart_settings SET cart_lifetime_days = ? WHERE id = 1',
      [cart_lifetime_days]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 