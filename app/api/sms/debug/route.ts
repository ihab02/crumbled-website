import { type NextRequest, NextResponse } from "next/server"
import { sendSMSFixed } from "@/lib/sms-service-fixed"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 SMS Debug POST request started")

    let requestBody: any
    try {
      const bodyText = await request.text()
      requestBody = JSON.parse(bodyText)
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
        },
        { status: 400 },
      )
    }

    const { phone, message } = requestBody

    if (!phone || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number and message are required",
        },
        { status: 400 },
      )
    }

    console.log(`🧪 Sending debug SMS to ${phone}: ${message}`)

    const result = await sendSMSFixed(phone, message)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      error: result.error,
      rawResponse: result.rawResponse,
      endpoint: result.endpoint,
      debug: {
        phone: phone,
        message: message,
        timestamp: new Date().toISOString(),
        note: "Using Node-RED SMS service",
      },
    })
  } catch (error) {
    console.error("❌ SMS Debug Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    primaryEndpoint: "https://nodered.crumbled-eg.com/sendSMS",
    fallbackEndpoints: [
      "https://nodered.crumbled-eg.com/api/sendSMS",
      "http://nodered.crumbled-eg.com/sendSMS",
      "http://3.250.91.63:1880/sendSMS",
    ],
    senderName: process.env.SMS_SENDER_NAME || "Manex",
    verificationMessageTemplate:
      "Your CrumbledCookies verification code is: {CODE}. Valid for 10 minutes. Do not share this code with anyone.",
    environment: process.env.NODE_ENV,
    note: "Using Node-RED SMS service with HTTPS",
  })
}
