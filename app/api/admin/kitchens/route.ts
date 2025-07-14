import { NextRequest, NextResponse } from 'next/server';
import { kitchenManagementService } from '@/lib/services/kitchenManagementService';
import { verifyJWT } from '@/lib/middleware/auth';

/**
 * GET /api/admin/kitchens
 * Get all kitchens with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token, 'admin');
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const isActive = searchParams.get('isActive');
    const includeCapacity = searchParams.get('includeCapacity');

    let kitchens;
    if (zoneId) {
      kitchens = await kitchenManagementService.getKitchensByZone(parseInt(zoneId));
    } else {
      kitchens = await kitchenManagementService.getAllKitchens();
    }

    // Filter by active status if specified
    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      kitchens = kitchens.filter(kitchen => kitchen.is_active === activeFilter);
    }

    // If includeCapacity is requested, return the full data structure
    if (includeCapacity === 'true') {
      return NextResponse.json({
        success: true,
        data: kitchens
      });
    }
    
    // Otherwise, return a simplified structure for basic kitchen selection
    const simplifiedKitchens = kitchens.map(kitchen => ({
      id: kitchen.id,
      name: kitchen.name,
      is_active: kitchen.is_active,
      capacity: kitchen.capacity
    }));

    return NextResponse.json({
      success: true,
      data: simplifiedKitchens
    });

  } catch (error) {
    console.error('Error fetching kitchens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kitchens' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/kitchens
 * Create a new kitchen
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token, 'admin');
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      zone_id,
      capacity
    } = body;

    // Validate required fields
    if (!name || !zone_id || !capacity) {
      return NextResponse.json(
        { error: 'Name, zone_id, and capacity are required' },
        { status: 400 }
      );
    }

    const kitchenData = {
      name,
      zone_id: parseInt(zone_id),
      capacity: parseInt(capacity)
    };

    const result = await kitchenManagementService.createKitchen(kitchenData);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Get the created kitchen
    const kitchen = await kitchenManagementService.getKitchenById(result.kitchenId!);
    
    return NextResponse.json({
      success: true,
      data: kitchen
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating kitchen:', error);
    return NextResponse.json(
      { error: 'Failed to create kitchen' },
      { status: 500 }
    );
  }
} 