import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      
      // Update each item's display_order
      for (const item of items) {
        await connection.query(
          'UPDATE product_types SET display_order = ? WHERE id = ?',
          [item.display_order, item.id]
        );
      }
      
      await connection.commit();
      return NextResponse.json({ success: true });
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error reordering product types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder product types' },
      { status: 500 }
    );
  }
} 