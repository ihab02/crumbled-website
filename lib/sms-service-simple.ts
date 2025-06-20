interface SimpleSMSResponse {
  success: boolean
  message: string
  code?: string
  error?: string
  rawResponse?: any
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

export async function sendSimpleSMS(phone: string, message: string): Promise<SimpleSMSResponse> {
  try {
    const smsUrl = "http://3.250.91.63:1880/sendSMS"
    const senderName = process.env.SMS_SENDER_NAME || "Manex"
    const formattedPhone = formatPhoneNumber(phone)

    console.log(`📱 Simple SMS - Sending to: ${smsUrl}`)
    console.log(`📱 Simple SMS - Phone: ${formattedPhone}`)
    console.log(`📱 Simple SMS - Message: ${message}`)

    const payload = {
      senderName: senderName,
      recipients: formattedPhone,
      messageText: message,
    }

    console.log(`📱 Simple SMS - Payload:`, payload)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(smsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log(`📱 Simple SMS - Response Status: ${response.status}`)

    const responseText = await response.text()
    console.log(`📱 Simple SMS - Response Text: ${responseText}`)

    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(responseText)
    } catch {
      parsedResponse = { rawText: responseText }
    }

    if (response.ok) {
      return {
        success: true,
        message: "SMS sent successfully",
        rawResponse: parsedResponse,
      }
    } else {
      return {
        success: false,
        message: `HTTP ${response.status}: ${responseText}`,
        error: `HTTP ${response.status}`,
        rawResponse: parsedResponse,
      }
    }
  } catch (error) {
    console.error("❌ Simple SMS Error:", error)

    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timeout"
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      message: errorMessage,
      error: errorMessage,
    }
  }
}

export async function sendVerificationCodeSimple(phone: string, code: string): Promise<SimpleSMSResponse> {
  const message = `Your CrumbledCookies verification code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`
  return sendSimpleSMS(phone, message)
}
