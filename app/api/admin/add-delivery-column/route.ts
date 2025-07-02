import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { verifyJWT } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Add delivery_man_id column to orders table
    await databaseService.query(`
      ALTER TABLE orders 
      ADD COLUMN delivery_man_id INT NULL AFTER subtotal
    `);

    // Add foreign key constraint
    await databaseService.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT fk_orders_delivery_man 
      FOREIGN KEY (delivery_man_id) REFERENCES delivery_men(id) 
      ON DELETE SET NULL
    `);

    // Add index for better performance
    await databaseService.query(`
      CREATE INDEX idx_orders_delivery_man ON orders(delivery_man_id)
    `);

    return NextResponse.json({
      success: true,
      message: 'Delivery column added successfully'
    });

  } catch (error) {
    console.error('Error adding delivery column:', error);
    return NextResponse.json(
      { error: 'Failed to add delivery column' },
      { status: 500 }
    );
  }
} 