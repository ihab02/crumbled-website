import { type NextRequest, NextResponse } from "next/server"
import mysql from 'mysql2/promise';
import pool from '@/lib/db';

// Cequens webhook handler for delivery reports
export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json()

    // Cequens typically sends delivery reports with these fields
    const { messageId, recipient, status, deliveredAt, errorCode, errorMessage } = body

    if (!messageId || !recipient) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    connection = await pool.getConnection();

    // Store delivery report
    await connection.query(
      `INSERT INTO sms_delivery_reports (
        message_id,
        phone,
        status,
        delivered_at,
        error_message
      ) VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        delivered_at = VALUES(delivered_at),
        error_message = VALUES(error_message),
        updated_at = CURRENT_TIMESTAMP`,
      [
        messageId,
        recipient,
        status,
        deliveredAt ? new Date(deliveredAt).toISOString() : null,
        errorMessage || null
      ]
    );

    // Update phone verification status if applicable
    if (status === "delivered" || status === "failed") {
      await connection.query(
        "UPDATE phone_verification SET sms_status = ? WHERE sms_message_id = ?",
        [status, messageId]
      );
    }

    console.log(`SMS delivery report processed: ${messageId} - ${status}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing SMS webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Handle GET requests for webhook verification (if required by Cequens)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get("challenge")

  if (challenge) {
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({ status: "SMS webhook endpoint active" })
}
