import { type NextRequest, NextResponse } from "next/server"
import { smsService } from "@/lib/sms-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, message } = body

    if (!phone || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number and message are required",
        },
        { status: 400 },
      )
    }

    try {
      const result = await smsService.sendSMS(phone, message)

      return NextResponse.json({
        success: true,
        message: "Test SMS sent successfully",
        result,
      })
    } catch (smsError) {
      console.error("SMS test failed:", smsError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send test SMS",
          details: smsError instanceof Error ? smsError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("SMS test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const isConnected = await smsService.testConnection()

    return NextResponse.json({
      success: true,
      connected: isConnected,
      message: isConnected ? "SMS service is reachable" : "SMS service connection failed",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: "Failed to test SMS service connection",
      },
      { status: 500 },
    )
  }
}
