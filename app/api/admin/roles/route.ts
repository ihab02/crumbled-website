import { NextRequest, NextResponse } from 'next/server';
import { rolePermissionService } from '@/lib/services/rolePermissionService';
import { verifyJWT } from '@/lib/middleware/auth';

/**
 * GET /api/admin/roles
 * Get all roles with optional filtering
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
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const roles = await rolePermissionService.getAllRoles();
    
    return NextResponse.json({
      success: true,
      data: roles
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/roles
 * Create a new role
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
      description,
      kitchenId,
      permissions,
      isActive = true
    } = body;

    // Validate required fields
    if (!name || !kitchenId) {
      return NextResponse.json(
        { error: 'Name and kitchen ID are required' },
        { status: 400 }
      );
    }

    const roleData = {
      name,
      description,
      permissions: permissions || []
    };

    const result = await rolePermissionService.createRole(roleData);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    const role = await rolePermissionService.getRoleById(result.roleId!);
    
    return NextResponse.json({
      success: true,
      data: role
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
} 