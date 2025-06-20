import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing SMS service connection...")

    const smsUrl = process.env.CUSTOM_SMS_URL || "https://3.250.91.63:1880"
    const senderName = process.env.SMS_SENDER_NAME || "Manex"

    // Test with a dummy phone number
    const testPayload = {
      senderName: senderName,
      recipients: "01234567890",
      messageText: "Connection test from CrumbledCookies",
    }

    console.log("🧪 Test payload:", testPayload)
    console.log("🧪 Test URL:", `${smsUrl}/sendSMS`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`${smsUrl}/sendSMS`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const responseText = await response.text()
    console.log("🧪 SMS service response:", responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { rawResponse: responseText }
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: `${smsUrl}/sendSMS`,
      testPayload: testPayload,
      response: responseData,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("🧪 SMS connection test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        url: `${process.env.CUSTOM_SMS_URL || "https://3.250.91.63:1880"}/sendSMS`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
