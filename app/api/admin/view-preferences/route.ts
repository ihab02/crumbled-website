import { NextRequest, NextResponse } from 'next/server';
import { ViewService } from '@/lib/services/viewService';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';

// GET - Get admin view preferences
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;
    
    if (!adminToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verifyJWT(adminToken, 'admin') as any;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const viewType = searchParams.get('view_type') as 'products' | 'flavors' | 'product_types' | 'orders';
    
    if (!viewType) {
      return NextResponse.json(
        { success: false, error: 'View type is required' },
        { status: 400 }
      );
    }

    const preferences = await ViewService.getAdminViewPreferences(
      decoded.id,
      viewType
    );

    return NextResponse.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error getting view preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get view preferences' },
      { status: 500 }
    );
  }
}

// POST - Update admin view preferences
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;
    
    if (!adminToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verifyJWT(adminToken, 'admin') as any;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { view_type, show_deleted } = body;

    if (!view_type || typeof show_deleted !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'View type and show_deleted are required' },
        { status: 400 }
      );
    }

    const success = await ViewService.updateAdminViewPreferences(
      decoded.id,
      view_type,
      show_deleted
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'View preferences updated successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update view preferences' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating view preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update view preferences' },
      { status: 500 }
    );
  }
} 