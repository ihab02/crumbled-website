import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, subject, message } = body;

    // Validate required fields
    if (!first_name || !last_name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await pool.getConnection();
      
      // Insert message into database
      await connection.query(
        `INSERT INTO contact_messages (first_name, last_name, email, subject, message) 
         VALUES (?, ?, ?, ?, ?)`,
        [first_name, last_name, email, subject, message]
      );

      return NextResponse.json(
        { success: true, message: 'Message sent successfully' },
        { status: 201 }
      );
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error saving contact message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
} 