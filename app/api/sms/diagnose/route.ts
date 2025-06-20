import { type NextRequest, NextResponse } from "next/server"

interface DiagnosticResult {
  step: string
  status: "success" | "failed" | "warning"
  message: string
  details?: any
  suggestion?: string
}

async function testDNSResolution(hostname: string): Promise<DiagnosticResult> {
  try {
    // Try to resolve the hostname
    const response = await fetch(`http://${hostname}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    })

    return {
      step: "DNS Resolution",
      status: "success",
      message: `Successfully resolved ${hostname}`,
      details: { hostname, resolved: true },
    }
  } catch (error) {
    return {
      step: "DNS Resolution",
      status: "failed",
      message: `Failed to resolve ${hostname}`,
      details: { hostname, error: error instanceof Error ? error.message : "Unknown error" },
      suggestion: "Check if the hostname is correct and accessible from your server",
    }
  }
}

async function testPortConnectivity(hostname: string, port: number): Promise<DiagnosticResult> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`http://${hostname}:${port}`, {
      method: "HEAD",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    return {
      step: `Port Connectivity (${port})`,
      status: "success",
      message: `Port ${port} is accessible on ${hostname}`,
      details: { hostname, port, accessible: true, status: response.status },
    }
  } catch (error) {
    return {
      step: `Port Connectivity (${port})`,
      status: "failed",
      message: `Port ${port} is not accessible on ${hostname}`,
      details: { hostname, port, error: error instanceof Error ? error.message : "Unknown error" },
      suggestion: "Check if the port is open and the service is running",
    }
  }
}

async function testSMSEndpoint(endpoint: string): Promise<DiagnosticResult> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const testPayload = {
      senderName: "TEST",
      recipients: "01000000000",
      messageText: "Test message",
    }

    console.log(`🔍 Testing endpoint: ${endpoint}`)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "CrumbledCookies-Diagnostic/1.0",
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const responseText = await response.text()
    console.log(`📨 Response from ${endpoint}: ${response.status} - ${responseText}`)

    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(responseText)
    } catch {
      parsedResponse = { rawText: responseText }
    }

    if (response.ok) {
      return {
        step: `SMS Endpoint Test`,
        status: "success",
        message: `Endpoint ${endpoint} responded successfully`,
        details: {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          response: parsedResponse,
        },
      }
    } else {
      return {
        step: `SMS Endpoint Test`,
        status: "warning",
        message: `Endpoint ${endpoint} responded with error ${response.status}`,
        details: {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          response: parsedResponse,
        },
        suggestion:
          response.status === 401
            ? "Check authentication credentials"
            : response.status === 404
              ? "Verify the endpoint path is correct"
              : response.status === 405
                ? "Check if POST method is allowed"
                : "Check the API documentation for required parameters",
      }
    }
  } catch (error) {
    return {
      step: `SMS Endpoint Test`,
      status: "failed",
      message: `Failed to connect to ${endpoint}`,
      details: {
        endpoint,
        error: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : "Unknown",
      },
      suggestion:
        error instanceof Error && error.name === "AbortError"
          ? "Request timed out - check network connectivity"
          : "Check if the endpoint URL is correct and accessible",
    }
  }
}

async function testEnvironmentVariables(): Promise<DiagnosticResult> {
  const smsUrl = process.env.CUSTOM_SMS_URL
  const senderName = process.env.SMS_SENDER_NAME

  const issues = []
  if (!smsUrl) issues.push("CUSTOM_SMS_URL not set")
  if (!senderName) issues.push("SMS_SENDER_NAME not set")

  if (issues.length === 0) {
    return {
      step: "Environment Variables",
      status: "success",
      message: "All required environment variables are set",
      details: {
        CUSTOM_SMS_URL: smsUrl,
        SMS_SENDER_NAME: senderName,
      },
    }
  } else {
    return {
      step: "Environment Variables",
      status: "warning",
      message: `Missing environment variables: ${issues.join(", ")}`,
      details: {
        missing: issues,
        current: {
          CUSTOM_SMS_URL: smsUrl || "not set",
          SMS_SENDER_NAME: senderName || "not set",
        },
      },
      suggestion: "Set the missing environment variables in your deployment",
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Starting SMS diagnostic...")

    const results: DiagnosticResult[] = []

    // Test 1: Environment Variables
    console.log("🔍 Testing environment variables...")
    results.push(await testEnvironmentVariables())

    // Test 2: DNS Resolution
    console.log("🔍 Testing DNS resolution...")
    results.push(await testDNSResolution("3.250.91.63"))

    // Test 3: Port Connectivity
    console.log("🔍 Testing port connectivity...")
    results.push(await testPortConnectivity("3.250.91.63", 1880))
    results.push(await testPortConnectivity("3.250.91.63", 80))
    results.push(await testPortConnectivity("3.250.91.63", 443))

    // Test 4: SMS Endpoints
    console.log("🔍 Testing SMS endpoints...")
    const endpoints = [
      "http://3.250.91.63:1880/sendSMS",
      "http://3.250.91.63/sendSMS",
      "https://3.250.91.63:1880/sendSMS",
      "https://3.250.91.63/sendSMS",
    ]

    for (const endpoint of endpoints) {
      results.push(await testSMSEndpoint(endpoint))
    }

    // Generate summary
    const summary = {
      total: results.length,
      success: results.filter((r) => r.status === "success").length,
      warnings: results.filter((r) => r.status === "warning").length,
      failures: results.filter((r) => r.status === "failed").length,
      timestamp: new Date().toISOString(),
    }

    // Determine overall status
    const hasFailures = results.some((r) => r.status === "failed")
    const hasWarnings = results.some((r) => r.status === "warning")

    let overallStatus = "success"
    let overallMessage = "All tests passed"

    if (hasFailures) {
      overallStatus = "failed"
      overallMessage = "Critical issues detected"
    } else if (hasWarnings) {
      overallStatus = "warning"
      overallMessage = "Some issues detected"
    }

    console.log("✅ SMS diagnostic completed")

    return NextResponse.json({
      success: true,
      overallStatus,
      overallMessage,
      summary,
      results,
      recommendations: generateRecommendations(results),
    })
  } catch (error) {
    console.error("❌ SMS diagnostic failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Diagnostic failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function generateRecommendations(results: DiagnosticResult[]): string[] {
  const recommendations = []

  const envResult = results.find((r) => r.step === "Environment Variables")
  if (envResult?.status !== "success") {
    recommendations.push("Set up environment variables: CUSTOM_SMS_URL and SMS_SENDER_NAME")
  }

  const dnsResult = results.find((r) => r.step === "DNS Resolution")
  if (dnsResult?.status === "failed") {
    recommendations.push("Check network connectivity - cannot resolve SMS service hostname")
  }

  const portResults = results.filter((r) => r.step.includes("Port Connectivity"))
  const accessiblePorts = portResults.filter((r) => r.status === "success")
  if (accessiblePorts.length === 0) {
    recommendations.push("No ports are accessible - check firewall rules and network connectivity")
  }

  const endpointResults = results.filter((r) => r.step === "SMS Endpoint Test")
  const workingEndpoints = endpointResults.filter((r) => r.status === "success")
  if (workingEndpoints.length === 0) {
    recommendations.push("No SMS endpoints are working - contact your SMS provider for correct configuration")
  }

  const httpsOnlyErrors = endpointResults.filter((r) =>
    r.details?.response?.rawText?.includes("only https is supported"),
  )
  if (httpsOnlyErrors.length > 0) {
    recommendations.push("SMS service requires HTTPS - try using HTTPS endpoints only")
  }

  if (recommendations.length === 0) {
    recommendations.push("SMS service appears to be working - check your specific use case")
  }

  return recommendations
}
