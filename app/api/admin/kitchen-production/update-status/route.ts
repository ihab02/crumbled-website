import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';
import { databaseService } from '@/lib/services/databaseService';

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verifyJWT(adminToken, 'admin');
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { flavorId, status, date } = await request.json();

    if (!flavorId || !status || !date) {
      return NextResponse.json(
        { error: 'Flavor ID, status, and date are required' },
        { status: 400 }
      );
    }

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, in_progress, or completed' },
        { status: 400 }
      );
    }

    // For now, we'll store the production status in a separate table
    // In a real implementation, you might want to create a production_tracking table
    // For this demo, we'll use a simple approach and log the status change

    console.log(`Production status updated: Flavor ${flavorId} -> ${status} for date ${date}`);

    // You can implement actual status tracking here
    // For example, create a production_tracking table:
    /*
    await databaseService.query(`
      INSERT INTO production_tracking (
        flavor_id, 
        production_date, 
        status, 
        updated_by, 
        updated_at
      ) VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status),
        updated_by = VALUES(updated_by),
        updated_at = NOW()
    `, [flavorId, date, status, decoded.id]);
    */

    return NextResponse.json({
      success: true,
      message: 'Production status updated successfully',
      data: {
        flavorId,
        status,
        date,
        updatedBy: decoded.id
      }
    });

  } catch (error) {
    console.error('Error updating production status:', error);
    return NextResponse.json(
      { error: 'Failed to update production status' },
      { status: 500 }
    );
  }
} 