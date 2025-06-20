interface SMSResult {
  success: boolean
  message: string
  code?: string
  error?: string
  rawResponse?: any
  endpoint?: string
}

function formatPhoneNumber(phone: string): string {
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

export async function sendSMSFixed(phone: string, message: string): Promise<SMSResult> {
  const formattedPhone = formatPhoneNumber(phone)

  // Updated to use your Node-RED instance
  const smsUrl = process.env.CUSTOM_SMS_URL || "https://nodered.crumbled-eg.com/sendSMS"
  const senderName = process.env.SMS_SENDER_NAME || "Manex"

  const payload = {
    senderName: senderName,
    recipients: formattedPhone,
    messageText: message,
  }

  console.log(`📱 SMS Fixed - Using URL: ${smsUrl}`)
  console.log(`📱 SMS Fixed - Sender: ${senderName}`)
  console.log(`📱 SMS Fixed - Phone: ${formattedPhone}`)
  console.log(`📱 SMS Fixed - Message: ${message}`)
  console.log(`📱 SMS Fixed - Payload:`, JSON.stringify(payload, null, 2))

  try {
    console.log(`🔄 Sending SMS to: ${smsUrl}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(smsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "CrumbledCookies-SMS/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log(`📨 Response Status: ${response.status} ${response.statusText}`)
    console.log(`📨 Response Headers:`, Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log(`📨 Response Text: ${responseText}`)

    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(responseText)
    } catch {
      parsedResponse = { rawText: responseText }
    }

    if (response.ok) {
      console.log(`✅ SMS sent successfully to ${formattedPhone}`)
      return {
        success: true,
        message: "SMS sent successfully",
        rawResponse: parsedResponse,
        endpoint: smsUrl,
      }
    } else {
      console.log(`⚠️ SMS failed with status ${response.status}: ${responseText}`)
      return {
        success: false,
        message: `SMS failed with status ${response.status}`,
        error: responseText,
        rawResponse: parsedResponse,
        endpoint: smsUrl,
      }
    }
  } catch (error) {
    console.error(`❌ SMS Error:`, error)

    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timeout - SMS service took too long to respond"
      } else if (error.message.includes("fetch failed")) {
        errorMessage = "Network error - cannot connect to SMS service"
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      message: "SMS service unavailable",
      error: errorMessage,
      rawResponse: {
        error: errorMessage,
        endpoint: smsUrl,
        note: "Check network connectivity and SMS service status",
      },
      endpoint: smsUrl,
    }
  }
}

export async function sendVerificationCodeFixed(phone: string, code: string): Promise<SMSResult> {
  const message = `Your CrumbledCookies verification code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`
  return sendSMSFixed(phone, message)
}
