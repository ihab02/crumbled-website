import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/social-settings
export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (?, ?, ?, ?)',
      ['whatsapp_number', 'facebook_url', 'instagram_url', 'tiktok_url']
    );

    const settings: any = {
      whatsapp_number: '',
      facebook_url: '',
      instagram_url: '',
      tiktok_url: ''
    };

    (rows as any[]).forEach((row: any) => {
      settings[row.setting_key] = row.setting_value || '';
    });

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching social settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/social-settings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { whatsapp_number, facebook_url, instagram_url, tiktok_url } = body;

    // Update or insert each setting
    const settings = [
      { key: 'whatsapp_number', value: whatsapp_number || '' },
      { key: 'facebook_url', value: facebook_url || '' },
      { key: 'instagram_url', value: instagram_url || '' },
      { key: 'tiktok_url', value: tiktok_url || '' }
    ];

    for (const setting of settings) {
      await pool.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [setting.key, setting.value, setting.value]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating social settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update social settings' },
      { status: 500 }
    );
  }
} 