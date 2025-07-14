import { NextRequest, NextResponse } from 'next/server';
import { kitchenAuth } from '@/lib/middleware/kitchenAuth';
import { databaseService } from '@/lib/services/databaseService';

/**
 * GET /api/kitchen/notifications
 * Get notifications for the current kitchen
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate kitchen user
    const authResult = await kitchenAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereConditions = ['n.kitchen_id = ?'];
    const params: any[] = [authResult.user.selectedKitchen.id];
    
    if (type) {
      whereConditions.push('n.type = ?');
      params.push(type);
    }
    
    if (isRead !== null) {
      whereConditions.push('n.is_read = ?');
      params.push(isRead === 'true' ? 1 : 0);
    }

    const query = `
      SELECT 
        n.*,
        ku.username as created_by_username
      FROM kitchen_notifications n
      LEFT JOIN kitchen_users ku ON n.created_by = ku.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const notifications = await databaseService.query(query, params);
    
    return NextResponse.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error fetching kitchen notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/kitchen/notifications/[id]/read
 * Mark notification as read
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate kitchen user
    const authResult = await kitchenAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Mark notification as read
    await databaseService.query(`
      UPDATE kitchen_notifications 
      SET is_read = true, read_at = NOW()
      WHERE id = ? AND kitchen_id = ?
    `, [notificationId, authResult.user.selectedKitchen.id]);

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
} 