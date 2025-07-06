import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let connection;
    try {
      connection = await pool.getConnection();

      // Get total count
      const [countResult] = await connection.query(
        'SELECT COUNT(*) as total FROM contact_messages'
      );
      const total = countResult[0].total;

      // Get messages with pagination
      const [messages] = await connection.query(
        `SELECT * FROM contact_messages 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return NextResponse.json({
        success: true,
        data: messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, is_read } = body;

    if (typeof messageId !== 'number' || typeof is_read !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.query(
        'UPDATE contact_messages SET is_read = ? WHERE id = ?',
        [is_read, messageId]
      );

      return NextResponse.json({
        success: true,
        message: 'Message status updated successfully'
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error updating message status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update message status' },
      { status: 500 }
    );
  }
} 