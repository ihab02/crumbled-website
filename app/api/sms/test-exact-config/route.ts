import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json()

    if (!phone || !message) {
      return NextResponse.json({ success: false, error: "Phone and message are required" }, { status: 400 })
    }

    // Updated to use your Node-RED instance
    const smsUrl = "https://nodered.crumbled-eg.com/sendSMS"
    const senderName = "Manex"

    // Format phone number for Egyptian format
    let formattedPhone = phone.replace(/[^\d+]/g, "")
    if (formattedPhone.startsWith("+20")) {
      formattedPhone = formattedPhone.substring(3)
    } else if (formattedPhone.startsWith("20")) {
      formattedPhone = formattedPhone.substring(2)
    }
    if (!formattedPhone.startsWith("0")) {
      formattedPhone = "0" + formattedPhone
    }

    const payload = {
      senderName: senderName,
      recipients: formattedPhone,
      messageText: message,
    }

    console.log("🧪 Testing Node-RED SMS configuration:")
    console.log(`📱 URL: ${smsUrl}`)
    console.log(`📱 Sender: ${senderName}`)
    console.log(`📱 Phone: ${formattedPhone}`)
    console.log(`📱 Payload:`, JSON.stringify(payload, null, 2))

    const startTime = Date.now()

    try {
      const response = await fetch(smsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "CrumbledCookies-Test/1.0",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      const responseText = await response.text()

      console.log(`📨 Response Status: ${response.status}`)
      console.log(`📨 Response Time: ${responseTime}ms`)
      console.log(`📨 Response Text: ${responseText}`)

      let parsedResponse: any
      try {
        parsedResponse = JSON.parse(responseText)
      } catch {
        parsedResponse = { rawText: responseText }
      }

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        endpoint: smsUrl,
        payload: payload,
        response: parsedResponse,
        headers: Object.fromEntries(response.headers.entries()),
        curlCommand: `curl -X POST "${smsUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '${JSON.stringify(payload)}'`,
      })
    } catch (fetchError) {
      const endTime = Date.now()
      const responseTime = endTime - startTime

      console.error("❌ Fetch Error:", fetchError)

      let errorType = "Unknown Error"
      let errorMessage = "Unknown error occurred"

      if (fetchError instanceof Error) {
        errorType = fetchError.name
        errorMessage = fetchError.message

        if (fetchError.name === "AbortError") {
          errorMessage = "Request timed out after 10 seconds"
        } else if (fetchError.message.includes("fetch failed")) {
          errorMessage = "Network connection failed - cannot reach Node-RED SMS service"
        } else if (fetchError.message.includes("ECONNREFUSED")) {
          errorMessage = "Connection refused - Node-RED service is not running or not accessible"
        } else if (fetchError.message.includes("ENOTFOUND")) {
          errorMessage = "DNS resolution failed - cannot find nodered.crumbled-eg.com"
        } else if (fetchError.message.includes("ETIMEDOUT")) {
          errorMessage = "Connection timed out - Node-RED service is not responding"
        }
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        errorType: errorType,
        responseTime: `${responseTime}ms`,
        endpoint: smsUrl,
        payload: payload,
        troubleshooting: {
          possibleCauses: [
            "Node-RED service is down or not running",
            "DNS resolution issues with nodered.crumbled-eg.com",
            "Network connectivity issues",
            "Firewall blocking HTTPS connections",
            "SSL certificate issues",
            "Incorrect endpoint path",
          ],
          nextSteps: [
            "Check if Node-RED service is running at nodered.crumbled-eg.com",
            "Verify DNS resolution for nodered.crumbled-eg.com",
            "Test the URL manually in a browser",
            "Check firewall rules for HTTPS traffic",
            "Verify SSL certificate is valid",
          ],
        },
        curlCommand: `curl -X POST "${smsUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '${JSON.stringify(payload)}'`,
      })
    }
  } catch (error) {
    console.error("❌ API Error:", error)
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
    configuration: {
      smsUrl: "https://nodered.crumbled-eg.com/sendSMS",
      senderName: "Manex",
      environment: process.env.NODE_ENV,
    },
    testEndpoint: "/api/sms/test-exact-config",
    note: "This endpoint tests your Node-RED SMS configuration",
  })
}
