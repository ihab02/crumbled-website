import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/middleware/auth';
import { databaseService } from '@/lib/services/databaseService';
import { debugLog } from '@/lib/debug-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const popupId = parseInt(params.id);
    if (isNaN(popupId)) {
      return NextResponse.json({ error: 'Invalid popup ID' }, { status: 400 });
    }

    // Fetch specific popup ad
    const popups = await databaseService.query(`
      SELECT 
        id, title, content_type, content, content_overlay, overlay_position, overlay_effect, overlay_background, overlay_padding, overlay_border_radius,
        image_url, video_url, background_color, text_color, button_text, button_color,
        button_url, show_button, auto_close_seconds,
        width, height, position, animation, delay_seconds,
        show_frequency, target_pages, exclude_pages,
        start_date, end_date, is_active, priority,
        created_at, updated_at
      FROM popup_ads 
      WHERE id = ?
    `, [popupId]);

    if (!popups || popups.length === 0) {
      return NextResponse.json({ error: 'Popup not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      popup: popups[0] 
    });

  } catch (error) {
    console.error('Error fetching popup ad:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch popup ad' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const popupId = parseInt(params.id);
    if (isNaN(popupId)) {
      return NextResponse.json({ error: 'Invalid popup ID' }, { status: 400 });
    }

    const body = await request.json();
    await debugLog('🔍 PUT /api/admin/popup-ads/[id] - Received data:', body);
    
    const {
      title,
      content_type,
      content,
      content_overlay,
      overlay_position,
      overlay_effect,
      overlay_background,
      overlay_padding,
      overlay_border_radius,
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

    // Handle JSON fields properly
    let targetPagesJson = null;
    let excludePagesJson = null;

    try {
      if (target_pages) {
        // If it's already a string, parse it to validate, then stringify
        if (typeof target_pages === 'string') {
          JSON.parse(target_pages); // Validate JSON
          targetPagesJson = target_pages;
        } else if (Array.isArray(target_pages)) {
          targetPagesJson = JSON.stringify(target_pages);
        } else {
          targetPagesJson = JSON.stringify([target_pages]);
        }
      }

      if (exclude_pages) {
        // If it's already a string, parse it to validate, then stringify
        if (typeof exclude_pages === 'string') {
          JSON.parse(exclude_pages); // Validate JSON
          excludePagesJson = exclude_pages;
        } else if (Array.isArray(exclude_pages)) {
          excludePagesJson = JSON.stringify(exclude_pages);
        } else {
          excludePagesJson = JSON.stringify([exclude_pages]);
        }
      }
    } catch (jsonError) {
      await debugLog('🔍 JSON parsing error:', jsonError);
      return NextResponse.json({ 
        error: 'Invalid JSON format for target_pages or exclude_pages' 
      }, { status: 400 });
    }

    // Update popup ad
    const result = await databaseService.query(`
      UPDATE popup_ads SET
        title = ?, content_type = ?, content = ?, content_overlay = ?, overlay_position = ?, overlay_effect = ?, overlay_background = ?, overlay_padding = ?, overlay_border_radius = ?,
        image_url = ?, video_url = ?, background_color = ?, text_color = ?, button_text = ?, button_color = ?, button_url = ?, show_button = ?, auto_close_seconds = ?,
        width = ?, height = ?, position = ?, animation = ?, delay_seconds = ?,
        show_frequency = ?, target_pages = ?, exclude_pages = ?,
        start_date = ?, end_date = ?, is_active = ?, priority = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title, content_type, content, content_overlay || false, overlay_position || 'center', overlay_effect || 'none', overlay_background || 'rgba(0,0,0,0.7)', overlay_padding || 20, overlay_border_radius || 10,
      image_url || null, video_url || null,
      background_color || '#ffffff', text_color || '#000000',
      button_text || 'Close', button_color || '#007bff', button_url || null, show_button !== undefined ? show_button : true, auto_close_seconds || 0,
      width || 400, height || 300, position || 'center',
      animation || 'fade', delay_seconds || 3,
      show_frequency || 'once',
      targetPagesJson,
      excludePagesJson,
      start_date || null, end_date || null,
      is_active !== undefined ? is_active : true,
      priority || 0,
      popupId
    ]);

    if (result && 'affectedRows' in result && result.affectedRows > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Popup ad updated successfully'
      });
    } else {
      return NextResponse.json({ 
        error: 'Popup not found or no changes made' 
      }, { status: 404 });
    }

  } catch (error) {
    await debugLog('🔍 Error updating popup ad:', error);
    console.error('Error updating popup ad:', error);
    return NextResponse.json({ 
      error: 'Failed to update popup ad' 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const popupId = parseInt(params.id);
    if (isNaN(popupId)) {
      return NextResponse.json({ error: 'Invalid popup ID' }, { status: 400 });
    }

    const body = await request.json();
    await debugLog('🔍 PATCH /api/admin/popup-ads/[id] - Received data:', body);
    
    // Handle different types of updates
    if (body.hasOwnProperty('is_active')) {
      // Update popup status
      const { is_active } = body;
      
      if (typeof is_active !== 'boolean') {
        return NextResponse.json({ 
          error: 'is_active must be a boolean' 
        }, { status: 400 });
      }

      const result = await databaseService.query(`
        UPDATE popup_ads SET
          is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [is_active, popupId]);

      if (result && 'affectedRows' in result && result.affectedRows > 0) {
        return NextResponse.json({ 
          success: true, 
          message: `Popup ${is_active ? 'activated' : 'deactivated'} successfully`
        });
      } else {
        return NextResponse.json({ 
          error: 'Popup not found' 
        }, { status: 404 });
      }
    } else if (body.hasOwnProperty('width') && body.hasOwnProperty('height')) {
      // Update dimensions
      const { width, height } = body;
      
      if (typeof width !== 'number' || typeof height !== 'number') {
        return NextResponse.json({ 
          error: 'width and height must be numbers' 
        }, { status: 400 });
      }

      const result = await databaseService.query(`
        UPDATE popup_ads SET width = ?, height = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [width, height, popupId]);

      if (result && 'affectedRows' in result && result.affectedRows > 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'Popup dimensions updated successfully'
        });
      } else {
        return NextResponse.json({ 
          error: 'Popup not found' 
        }, { status: 404 });
      }
    } else {
      return NextResponse.json({ 
        error: 'Invalid update operation' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error updating popup:', error);
    return NextResponse.json({ 
      error: 'Failed to update popup' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const popupId = parseInt(params.id);
    if (isNaN(popupId)) {
      return NextResponse.json({ error: 'Invalid popup ID' }, { status: 400 });
    }

    // Delete popup ad (this will also delete related analytics due to CASCADE)
    const result = await databaseService.query(`
      DELETE FROM popup_ads WHERE id = ?
    `, [popupId]);

    if (result && 'affectedRows' in result && result.affectedRows > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Popup ad deleted successfully'
      });
    } else {
      return NextResponse.json({ 
        error: 'Popup not found' 
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error deleting popup ad:', error);
    return NextResponse.json({ 
      error: 'Failed to delete popup ad' 
    }, { status: 500 });
  }
} 