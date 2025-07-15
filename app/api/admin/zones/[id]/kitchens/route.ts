import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/middleware/auth';
import { databaseService } from '@/lib/services/databaseService';

/**
 * GET /api/admin/zones/[id]/kitchens
 * Get kitchen assignments for a specific zone
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyJWT(token, 'admin');
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const zoneId = parseInt(params.id);
    if (isNaN(zoneId)) {
      return NextResponse.json(
        { error: 'Invalid zone ID' },
        { status: 400 }
      );
    }

    // Get kitchen assignments for this zone with kitchen names
    const assignments = await databaseService.query(`
      SELECT 
        kz.kitchen_id,
        kz.zone_id,
        kz.is_primary,
        kz.priority,
        kz.is_active,
        k.name as kitchen_name
      FROM kitchen_zones kz
      LEFT JOIN kitchens k ON kz.kitchen_id = k.id
      WHERE kz.zone_id = ? AND kz.is_active = true
      ORDER BY kz.priority ASC, kz.is_primary DESC
    `, [zoneId]);

    return NextResponse.json(assignments);

  } catch (error) {
    console.error('Error fetching zone kitchens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zone kitchens' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/zones/[id]/kitchens
 * Update kitchen assignments for a specific zone
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyJWT(token, 'admin');
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const zoneId = parseInt(params.id);
    if (isNaN(zoneId)) {
      return NextResponse.json(
        { error: 'Invalid zone ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { assignments } = body;

    if (!Array.isArray(assignments)) {
      return NextResponse.json(
        { error: 'Invalid assignments data' },
        { status: 400 }
      );
    }

    await databaseService.transaction(async (connection) => {
      // First, deactivate all existing assignments for this zone
      await connection.execute(`
        UPDATE kitchen_zones 
        SET is_active = false 
        WHERE zone_id = ?
      `, [zoneId]);

      // Then, insert or update the new assignments
      for (const assignment of assignments) {
        const { kitchen_id, is_primary, priority } = assignment;
        
        await connection.execute(`
          INSERT INTO kitchen_zones (kitchen_id, zone_id, is_primary, priority, is_active)
          VALUES (?, ?, ?, ?, true)
          ON DUPLICATE KEY UPDATE 
            is_primary = VALUES(is_primary),
            priority = VALUES(priority),
            is_active = true
        `, [kitchen_id, zoneId, is_primary, priority]);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Kitchen assignments updated successfully'
    });

  } catch (error) {
    console.error('Error updating zone kitchens:', error);
    return NextResponse.json(
      { error: 'Failed to update zone kitchens' },
      { status: 500 }
    );
  }
} 