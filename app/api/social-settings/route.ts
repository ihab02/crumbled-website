import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/social-settings
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