import { NextRequest, NextResponse } from 'next/server';
import { kitchenManagementService } from '@/lib/services/kitchenManagementService';
import { verifyJWT } from '@/lib/middleware/auth';

/**
 * GET /api/admin/kitchens/[id]
 * Get a specific kitchen by ID
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

    const kitchenId = parseInt(params.id);
    if (isNaN(kitchenId)) {
      return NextResponse.json(
        { error: 'Invalid kitchen ID' },
        { status: 400 }
      );
    }

    const kitchen = await kitchenManagementService.getKitchenById(kitchenId);

    if (!kitchen) {
      return NextResponse.json(
        { error: 'Kitchen not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: kitchen
    });

  } catch (error) {
    console.error('Error fetching kitchen:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kitchen' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/kitchens/[id]
 * Update a kitchen
 */
export async function PUT(
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

    const kitchenId = parseInt(params.id);
    if (isNaN(kitchenId)) {
      return NextResponse.json(
        { error: 'Invalid kitchen ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      address,
      phone,
      email,
      zoneIds,
      capacity,
      isActive
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (zoneIds !== undefined && zoneIds.length > 0) updateData.zone_id = parseInt(zoneIds[0]); // Take first zone
    if (capacity !== undefined && typeof capacity === 'object') {
      updateData.capacity = parseInt(capacity.max_orders_per_hour || 50);
    }
    if (isActive !== undefined) updateData.is_active = isActive;

    const result = await kitchenManagementService.updateKitchen(kitchenId, updateData);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Get the updated kitchen
    const kitchen = await kitchenManagementService.getKitchenById(kitchenId);

    return NextResponse.json({
      success: true,
      data: kitchen
    });

  } catch (error) {
    console.error('Error updating kitchen:', error);
    return NextResponse.json(
      { error: 'Failed to update kitchen' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/kitchens/[id]
 * Delete a kitchen (soft delete)
 */
export async function DELETE(
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

    const kitchenId = parseInt(params.id);
    if (isNaN(kitchenId)) {
      return NextResponse.json(
        { error: 'Invalid kitchen ID' },
        { status: 400 }
      );
    }

    const result = await kitchenManagementService.deleteKitchen(kitchenId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kitchen deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting kitchen:', error);
    return NextResponse.json(
      { error: 'Failed to delete kitchen' },
      { status: 500 }
    );
  }
} 