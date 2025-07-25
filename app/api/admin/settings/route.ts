import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { clearDebugModeCache } from '@/lib/debug-utils';

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
    const body = await request.json();
    const { cart_lifetime_days, debug_mode } = body;

    // Handle cart lifetime updates
    if (cart_lifetime_days !== undefined) {
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
    }

    // Handle debug mode updates
    if (debug_mode !== undefined) {
      if (typeof debug_mode !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'Debug mode must be a boolean value' },
          { status: 400 }
        );
      }

      await pool.query(
        'UPDATE cart_settings SET debug_mode = ? WHERE id = 1',
        [debug_mode]
      );

      // Clear debug mode cache to ensure immediate effect
      clearDebugModeCache();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 