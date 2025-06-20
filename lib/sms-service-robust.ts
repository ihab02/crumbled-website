interface SMSServiceConfig {
  endpoints: string[]
  senderName: string
  timeout: number
}

interface SMSResponse {
  success: boolean
  messageId?: string
  status: string
  message: string
  rawResponse?: any
  endpoint?: string
  error?: string
}

class RobustSMSService {
  private config: SMSServiceConfig

  constructor() {
    this.config = {
      // Try HTTP first since the service seems to have HTTPS issues
      endpoints: [
        "http://3.250.91.63:1880",
        "https://3.250.91.63:1880",
        process.env.CUSTOM_SMS_URL || "http://3.250.91.63:1880",
      ].filter((url, index, arr) => arr.indexOf(url) === index), // Remove duplicates
      senderName: process.env.SMS_SENDER_NAME || "Manex",
      timeout: 15000,
    }

    console.log("Robust SMS Service initialized with config:", {
      endpoints: this.config.endpoints,
      senderName: this.config.senderName,
      timeout: this.config.timeout,
    })
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[^\d+]/g, "")

    if (cleaned.startsWith("+20")) {
      cleaned = cleaned.substring(3)
    } else if (cleaned.startsWith("20")) {
      cleaned = cleaned.substring(2)
    }

    if (!cleaned.startsWith("0")) {
      cleaned = "0" + cleaned
    }

    if (cleaned.length === 11 && cleaned.startsWith("01")) {
      return cleaned
    }

    if (cleaned.length === 10 && cleaned.startsWith("1")) {
      return "0" + cleaned
    }

    return cleaned
  }

  private async tryEndpoint(endpoint: string, phone: string, message: string): Promise<SMSResponse> {
    const smsUrl = `${endpoint}/sendSMS`
    const formattedPhone = this.formatPhoneNumber(phone)

    console.log(`🔄 Trying endpoint: ${smsUrl}`)
    console.log(`📱 Phone: ${formattedPhone}`)

    const payload = {
      senderName: this.config.senderName,
      recipients: formattedPhone,
      messageText: message,
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const fetchOptions: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "CrumbledCookies/1.0",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }

      // For HTTPS endpoints with potential SSL issues, add additional options
      if (endpoint.startsWith("https://")) {
        console.log("🔒 Using HTTPS endpoint")
      } else {
        console.log("🔓 Using HTTP endpoint")
      }

      const response = await fetch(smsUrl, fetchOptions)
      clearTimeout(timeoutId)

      console.log(`📨 Response Status: ${response.status} ${response.statusText}`)

      const responseText = await response.text()
      console.log(`📨 Response Body: ${responseText}`)

      let parsedResponse: any
      try {
        parsedResponse = JSON.parse(responseText)
      } catch {
        parsedResponse = { rawText: responseText }
      }

      if (response.ok) {
        return {
          success: true,
          messageId: parsedResponse.messageId || parsedResponse.id || `sms_${Date.now()}`,
          status: parsedResponse.status || "sent",
          message: "SMS sent successfully",
          rawResponse: parsedResponse,
          endpoint: endpoint,
        }
      } else {
        return {
          success: false,
          status: "failed",
          message: `HTTP ${response.status}: ${responseText}`,
          rawResponse: parsedResponse,
          endpoint: endpoint,
          error: `HTTP ${response.status}`,
        }
      }
    } catch (error) {
      clearTimeout(timeoutId)

      let errorMessage = "Unknown error"
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Request timeout"
        } else if (error.message.includes("fetch failed")) {
          errorMessage = "Network connection failed"
        } else if (error.message.includes("certificate")) {
          errorMessage = "SSL certificate error"
        } else if (error.message.includes("ECONNREFUSED")) {
          errorMessage = "Connection refused"
        } else if (error.message.includes("ENOTFOUND")) {
          errorMessage = "Host not found"
        } else {
          errorMessage = error.message
        }
      }

      console.log(`❌ Endpoint ${endpoint} failed: ${errorMessage}`)

      return {
        success: false,
        status: "error",
        message: errorMessage,
        endpoint: endpoint,
        error: errorMessage,
      }
    }
  }

  async sendSMS(phone: string, message: string): Promise<SMSResponse> {
    console.log(`🚀 Starting SMS send to ${phone}`)
    console.log(`📝 Message: ${message}`)

    const errors: string[] = []

    // Try each endpoint in order
    for (const endpoint of this.config.endpoints) {
      try {
        const result = await this.tryEndpoint(endpoint, phone, message)

        if (result.success) {
          console.log(`✅ SMS sent successfully via ${endpoint}`)
          return result
        } else {
          console.log(`⚠️ Endpoint ${endpoint} failed: ${result.message}`)
          errors.push(`${endpoint}: ${result.message}`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        console.log(`❌ Endpoint ${endpoint} threw error: ${errorMsg}`)
        errors.push(`${endpoint}: ${errorMsg}`)
      }
    }

    // All endpoints failed
    console.log("❌ All SMS endpoints failed")
    return {
      success: false,
      status: "failed",
      message: "All SMS endpoints failed",
      error: errors.join("; "),
    }
  }

  async sendVerificationCode(phone: string, code: string): Promise<SMSResponse> {
    const message = `Your CrumbledCookies verification code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`
    return this.sendSMS(phone, message)
  }

  async testConnection(): Promise<{ success: boolean; message: string; details: any }> {
    console.log("🧪 Testing SMS service connections...")

    const results: any[] = []

    for (const endpoint of this.config.endpoints) {
      try {
        const result = await this.tryEndpoint(endpoint, "01234567890", "Connection test")
        results.push({
          endpoint,
          success: result.success,
          status: result.status,
          message: result.message,
          error: result.error,
        })
      } catch (error) {
        results.push({
          endpoint,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    const successfulEndpoints = results.filter((r) => r.success)
    const hasWorkingEndpoint = successfulEndpoints.length > 0

    return {
      success: hasWorkingEndpoint,
      message: hasWorkingEndpoint
        ? `${successfulEndpoints.length} of ${results.length} endpoints working`
        : "No working SMS endpoints found",
      details: {
        endpoints: results,
        workingCount: successfulEndpoints.length,
        totalCount: results.length,
      },
    }
  }
}

// Export singleton instance
export const robustSMSService = new RobustSMSService()
export type { SMSResponse }
