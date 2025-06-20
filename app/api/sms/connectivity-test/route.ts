import { NextResponse } from "next/server"

export async function GET() {
  const results = []

  // Test different endpoints to see which ones are reachable
  const endpoints = [
    "http://3.250.91.63:1880/sendSMS",
    "http://3.250.91.63/sendSMS",
    "https://3.250.91.63:1880/sendSMS",
    "https://3.250.91.63/sendSMS",
    "http://3.250.91.63:1880",
    "https://3.250.91.63:1880",
  ]

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing connectivity to: ${endpoint}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(endpoint, {
        method: endpoint.includes("/sendSMS") ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        ...(endpoint.includes("/sendSMS") && {
          body: JSON.stringify({
            senderName: "Test",
            recipients: "01000000000",
            messageText: "Test connectivity",
          }),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseText = await response.text()

      results.push({
        endpoint,
        status: response.status,
        statusText: response.statusText,
        reachable: true,
        response: responseText.substring(0, 200), // First 200 chars
        headers: Object.fromEntries(response.headers.entries()),
      })
    } catch (error) {
      results.push({
        endpoint,
        reachable: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalTested: endpoints.length,
      reachable: results.filter((r) => r.reachable).length,
      unreachable: results.filter((r) => !r.reachable).length,
    },
  })
}
