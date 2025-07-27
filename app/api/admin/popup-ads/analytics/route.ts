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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const popupId = searchParams.get('popupId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = `
      SELECT 
        pa.id as popup_id,
        pa.title,
        pa.content_type,
        COUNT(CASE WHEN paa.action = 'shown' THEN 1 END) as total_shown,
        COUNT(CASE WHEN paa.action = 'clicked' THEN 1 END) as total_clicked,
        COUNT(CASE WHEN paa.action = 'closed' THEN 1 END) as total_closed,
        COUNT(CASE WHEN paa.action = 'ignored' THEN 1 END) as total_ignored,
        CASE 
          WHEN COUNT(CASE WHEN paa.action = 'shown' THEN 1 END) > 0 
          THEN ROUND(COUNT(CASE WHEN paa.action = 'clicked' THEN 1 END) * 100.0 / COUNT(CASE WHEN paa.action = 'shown' THEN 1 END), 2)
          ELSE 0 
        END as click_rate,
        CASE 
          WHEN COUNT(CASE WHEN paa.action = 'shown' THEN 1 END) > 0 
          THEN ROUND((COUNT(CASE WHEN paa.action = 'clicked' THEN 1 END) + COUNT(CASE WHEN paa.action = 'closed' THEN 1 END)) * 100.0 / COUNT(CASE WHEN paa.action = 'shown' THEN 1 END), 2)
          ELSE 0 
        END as engagement_rate
      FROM popup_ads pa
      LEFT JOIN popup_analytics paa ON pa.id = paa.popup_id
    `;

    const queryParams: any[] = [];
    const conditions: string[] = [];

    if (popupId) {
      conditions.push('pa.id = ?');
      queryParams.push(parseInt(popupId));
    }

    if (startDate) {
      conditions.push('paa.created_at >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      conditions.push('paa.created_at <= ?');
      queryParams.push(endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY pa.id, pa.title, pa.content_type
      ORDER BY total_shown DESC
    `;

    const analytics = await databaseService.query(query, queryParams);

    // Get overall statistics
    const overallStats = await databaseService.query(`
      SELECT 
        COUNT(DISTINCT paa.popup_id) as total_popups_with_analytics,
        COUNT(CASE WHEN paa.action = 'shown' THEN 1 END) as total_views,
        COUNT(CASE WHEN paa.action = 'clicked' THEN 1 END) as total_clicks,
        COUNT(CASE WHEN paa.action = 'closed' THEN 1 END) as total_closes,
        COUNT(CASE WHEN paa.action = 'ignored' THEN 1 END) as total_ignores,
        CASE 
          WHEN COUNT(CASE WHEN paa.action = 'shown' THEN 1 END) > 0 
          THEN ROUND(COUNT(CASE WHEN paa.action = 'clicked' THEN 1 END) * 100.0 / COUNT(CASE WHEN paa.action = 'shown' THEN 1 END), 2)
          ELSE 0 
        END as overall_click_rate
      FROM popup_analytics paa
      ${startDate || endDate ? 'WHERE ' + (startDate ? 'paa.created_at >= ?' : '') + (startDate && endDate ? ' AND ' : '') + (endDate ? 'paa.created_at <= ?' : '') : ''}
    `, startDate || endDate ? [startDate, endDate].filter(Boolean) : []);

    // Get recent activity
    const recentActivity = await databaseService.query(`
      SELECT 
        paa.id,
        paa.popup_id,
        pa.title as popup_title,
        paa.action,
        paa.page_url,
        paa.created_at,
        c.first_name,
        c.last_name,
        c.email
      FROM popup_analytics paa
      LEFT JOIN popup_ads pa ON paa.popup_id = pa.id
      LEFT JOIN customers c ON paa.user_id = c.id
      ORDER BY paa.created_at DESC
      LIMIT 50
    `);

    return NextResponse.json({ 
      success: true, 
      analytics: analytics || [],
      overallStats: overallStats?.[0] || {},
      recentActivity: recentActivity || []
    });

  } catch (error) {
    console.error('Error fetching popup analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch popup analytics' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint is for tracking popup interactions (called from frontend)
    const body = await request.json();
    const {
      popup_id,
      action,
      page_url,
      user_agent,
      ip_address,
      session_id,
      user_id
    } = body;

    if (!popup_id || !action || !session_id) {
      return NextResponse.json({ 
        error: 'popup_id, action, and session_id are required' 
      }, { status: 400 });
    }

    // Validate action
    const validActions = ['shown', 'clicked', 'closed', 'ignored'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action' 
      }, { status: 400 });
    }

    // Insert analytics record
    const result = await databaseService.query(`
      INSERT INTO popup_analytics (
        popup_id, session_id, user_id, action, page_url, user_agent, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      popup_id, session_id, user_id || null, action, 
      page_url || null, user_agent || null, ip_address || null
    ]);

    if (result && 'insertId' in result) {
      return NextResponse.json({ 
        success: true, 
        message: 'Analytics recorded successfully'
      });
    } else {
      throw new Error('Failed to record analytics');
    }

  } catch (error) {
    console.error('Error recording popup analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to record analytics' 
    }, { status: 500 });
  }
} 