import { type NextRequest, NextResponse } from "next/server"
import { smsService } from "@/lib/sms-service"
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, type = "confirmation" } = body

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    // Get order details
    const [orderResult] = await pool.query(
      `SELECT 
        o.*,
        u.phone as customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?`,
      [orderId]
    )

    if (!Array.isArray(orderResult) || orderResult.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    const order = orderResult[0] as any
    const phone = order.customer_phone || order.phone

    if (!phone) {
      return NextResponse.json({ success: false, error: "No phone number found for this order" }, { status: 400 })
    }

    let smsResult
    try {
      switch (type) {
        case "confirmation":
          smsResult = await smsService.sendSMS(phone, `Order ${order.order_number} confirmed!`)
          break
        case "status_update":
          smsResult = await smsService.sendSMS(phone, `Order ${order.order_number} status: ${order.status}`)
          break
        default:
          return NextResponse.json({ success: false, error: "Invalid notification type" }, { status: 400 })
      }

      // Log the notification
      await pool.query(
        `INSERT INTO order_notifications (
          order_id,
          phone,
          notification_type,
          sms_message_id,
          status,
          sent_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [orderId, phone, type, smsResult.messageId, smsResult.status]
      )

      return NextResponse.json({
        success: true,
        message: "SMS notification sent successfully",
        messageId: smsResult.messageId,
      })
    } catch (smsError) {
      console.error("Failed to send SMS notification:", smsError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send SMS notification",
          details: smsError instanceof Error ? smsError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Order notification error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
