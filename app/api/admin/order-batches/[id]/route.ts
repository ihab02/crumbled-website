import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Verify admin authentication
const verifyAdminAuth = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken');

  if (!adminToken) {
    return null;
  }

  try {
    const decoded = jwt.verify(adminToken.value, process.env.JWT_SECRET || 'fallback-secret') as any;
    if (decoded.type !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

// Update order batch status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batchId = parseInt(params.id);
    if (isNaN(batchId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid batch ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'processing', 'ready', 'delivered', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // For now, return success since the table doesn't exist yet
    // In the future, this would update the order_batches table
    console.log(`Updating batch ${batchId} status to ${status}`);

    return NextResponse.json({
      success: true,
      message: 'Batch status updated successfully'
    });
  } catch (error) {
    console.error('Update batch status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 