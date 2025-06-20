import { type NextRequest, NextResponse } from "next/server"
import { sendSimpleSMS } from "@/lib/sms-service-simple"

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json()

    if (!phone || !message) {
      return NextResponse.json({ success: false, error: "Phone and message are required" }, { status: 400 })
    }

    console.log(`🧪 Simple SMS Test - Phone: ${phone}, Message: ${message}`)

    const result = await sendSimpleSMS(phone, message)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      error: result.error,
      rawResponse: result.rawResponse,
      endpoint: "http://3.250.91.63:1880/sendSMS",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Simple SMS Test Error:", error)
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
