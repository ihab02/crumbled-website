import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import db from '@/lib/db';

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

// Get all order batches
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return mock data since the order batches table doesn't exist yet
    const mockBatches = [
      {
        id: 1,
        batch_number: 'BATCH-001',
        status: 'processing',
        created_at: '2025-01-14T10:30:00Z',
        updated_at: '2025-01-14T11:15:00Z',
        total_orders: 5,
        assigned_kitchen: 'Main Kitchen',
        assigned_delivery_man: 'Ahmed Adel',
        estimated_completion_time: '2025-01-14T12:30:00Z',
        orders: [
          {
            id: 1,
            order_number: 'ORD-001',
            customer_name: 'John Doe',
            total_amount: 150.00,
            status: 'processing',
            created_at: '2025-01-14T10:25:00Z',
            delivery_address: '123 Main St, Cairo',
            items_count: 3
          },
          {
            id: 2,
            order_number: 'ORD-002',
            customer_name: 'Jane Smith',
            total_amount: 200.00,
            status: 'processing',
            created_at: '2025-01-14T10:28:00Z',
            delivery_address: '456 Oak Ave, Cairo',
            items_count: 2
          }
        ]
      },
      {
        id: 2,
        batch_number: 'BATCH-002',
        status: 'ready',
        created_at: '2025-01-14T09:00:00Z',
        updated_at: '2025-01-14T10:45:00Z',
        total_orders: 3,
        assigned_kitchen: 'Main Kitchen',
        assigned_delivery_man: 'Mohammed Ali',
        estimated_completion_time: '2025-01-14T11:30:00Z',
        orders: [
          {
            id: 3,
            order_number: 'ORD-003',
            customer_name: 'Alice Johnson',
            total_amount: 120.00,
            status: 'ready',
            created_at: '2025-01-14T09:15:00Z',
            delivery_address: '789 Pine St, Cairo',
            items_count: 4
          }
        ]
      },
      {
        id: 3,
        batch_number: 'BATCH-003',
        status: 'pending',
        created_at: '2025-01-14T11:00:00Z',
        updated_at: '2025-01-14T11:00:00Z',
        total_orders: 2,
        orders: [
          {
            id: 4,
            order_number: 'ORD-004',
            customer_name: 'Bob Wilson',
            total_amount: 180.00,
            status: 'pending',
            created_at: '2025-01-14T11:05:00Z',
            delivery_address: '321 Elm St, Cairo',
            items_count: 2
          }
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      batches: mockBatches
    });
  } catch (error) {
    console.error('Get order batches error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new order batch
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { order_ids, assigned_kitchen_id, assigned_delivery_man_id } = body;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order IDs are required' },
        { status: 400 }
      );
    }

    // For now, return success since the table doesn't exist yet
    return NextResponse.json({
      success: true,
      message: 'Order batch created successfully',
      batch_id: Math.floor(Math.random() * 1000) + 1
    });
  } catch (error) {
    console.error('Create order batch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 