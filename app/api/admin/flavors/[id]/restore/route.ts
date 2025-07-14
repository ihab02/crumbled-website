import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';
import { ViewService } from '@/lib/services/viewService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let decoded;
    try {
      decoded = verifyJWT(adminToken, 'admin');
    } catch (error) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const flavorId = parseInt(params.id);
    if (isNaN(flavorId)) {
      return NextResponse.json(
        { error: 'Invalid flavor ID' },
        { status: 400 }
      );
    }

    const adminUserId = decoded.id;

    // Use ViewService to restore the flavor
    const success = await ViewService.restore('flavors', flavorId, adminUserId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to restore flavor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Flavor restored successfully'
    });

  } catch (error) {
    console.error('Error restoring flavor:', error);
    return NextResponse.json(
      { error: 'Failed to restore flavor' },
      { status: 500 }
    );
  }
} 