import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/middleware/auth';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminToken = request.cookies.get('adminToken')?.value;
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await verifyJWT(adminToken, 'admin');
    if (!admin) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch all popup ads
    const popups = await databaseService.query(`
      SELECT 
        id, title, content_type, content, image_url, video_url,
        background_color, text_color, button_text, button_color,
        button_url, show_button, auto_close_seconds,
        width, height, position, animation, delay_seconds,
        show_frequency, target_pages, exclude_pages,
        start_date, end_date, is_active, priority,
        created_at, updated_at
      FROM popup_ads 
      ORDER BY priority DESC, created_at DESC
    `);

    return NextResponse.json({ 
      success: true, 
      popups: popups || [] 
    });

  } catch (error) {
    console.error('Error fetching popup ads:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch popup ads' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminToken = request.cookies.get('adminToken')?.value;
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await verifyJWT(adminToken, 'admin');
    if (!admin) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    console.log('🔍 POST /api/admin/popup-ads - Received data:', body);
    
    const {
      title,
      content_type,
      content,
      image_url,
      video_url,
      background_color,
      text_color,
      button_text,
      button_color,
      button_url,
      show_button,
      auto_close_seconds,
      width,
      height,
      position,
      animation,
      delay_seconds,
      show_frequency,
      target_pages,
      exclude_pages,
      start_date,
      end_date,
      is_active,
      priority
    } = body;

    // Validate required fields
    if (!title || !content_type || !content) {
      return NextResponse.json({ 
        error: 'Title, content type, and content are required' 
      }, { status: 400 });
    }

    // Validate content type
    const validContentTypes = ['image', 'text', 'html', 'video'];
    if (!validContentTypes.includes(content_type)) {
      return NextResponse.json({ 
        error: 'Invalid content type' 
      }, { status: 400 });
    }

    // Insert new popup ad
    const result = await databaseService.query(`
      INSERT INTO popup_ads (
        title, content_type, content, image_url, video_url,
        background_color, text_color, button_text, button_color, button_url, show_button, auto_close_seconds,
        width, height, position, animation, delay_seconds,
        show_frequency, target_pages, exclude_pages,
        start_date, end_date, is_active, priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, content_type, content, image_url || null, video_url || null,
      background_color || '#ffffff', text_color || '#000000',
      button_text || 'Close', button_color || '#007bff', button_url || null, show_button !== undefined ? show_button : true, auto_close_seconds || 0,
      width || 400, height || 300, position || 'center',
      animation || 'fade', delay_seconds || 3,
      show_frequency || 'once',
      target_pages ? JSON.stringify(target_pages) : null,
      exclude_pages ? JSON.stringify(exclude_pages) : null,
      start_date || null, end_date || null,
      is_active !== undefined ? is_active : true,
      priority || 0
    ]);

    if (result && 'insertId' in result) {
      return NextResponse.json({ 
        success: true, 
        message: 'Popup ad created successfully',
        popupId: result.insertId
      });
    } else {
      throw new Error('Failed to create popup ad');
    }

  } catch (error) {
    console.error('Error creating popup ad:', error);
    return NextResponse.json({ 
      error: 'Failed to create popup ad' 
    }, { status: 500 });
  }
} 