import { type NextRequest, NextResponse } from "next/server"
import { sendVerificationCodeFixed } from "@/lib/sms-service-fixed"

// Simple in-memory storage for development (replace with Redis in production)
const verificationCodes = new Map<string, { code: string; expires: number }>()
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function checkRateLimit(phone: string): { allowed: boolean; remainingAttempts: number; resetTime: number } {
  const now = Date.now()
  const key = phone
  const limit = 5 // 5 attempts per hour
  const windowMs = 60 * 60 * 1000 // 1 hour

  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remainingAttempts: limit - 1, resetTime: now + windowMs }
  }

  if (record.count >= limit) {
    return { allowed: false, remainingAttempts: 0, resetTime: record.resetTime }
  }

  record.count++
  return { allowed: true, remainingAttempts: limit - record.count, resetTime: record.resetTime }
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

export async function POST(request: NextRequest) {
  try {
    console.log("📱 SMS Verification POST request started")

    let requestBody: any
    try {
      const bodyText = await request.text()
      console.log("📱 Request body text:", bodyText)
      requestBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.error("❌ Request parsing error:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          debug: "Request body must be valid JSON",
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const { phone } = requestBody

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Valid phone number is required",
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const normalizedPhone = formatPhoneNumber(phone)
    console.log("📱 Normalized phone:", normalizedPhone)

    const rateLimit = checkRateLimit(normalizedPhone)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many verification attempts. Please try again later.",
          rateLimited: true,
          resetTime: new Date(rateLimit.resetTime).toISOString(),
        },
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const code = generateVerificationCode()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    console.log("📱 Generated code:", code)

    verificationCodes.set(normalizedPhone, {
      code: code,
      expires: expiresAt,
    })

    // Use the fixed SMS service
    console.log("📱 Attempting to send SMS via fixed service...")
    const smsResult = await sendVerificationCodeFixed(normalizedPhone, code)

    console.log("📱 SMS Result:", smsResult)

    // Always return success with the code for development/testing
    return NextResponse.json(
      {
        success: true,
        message: smsResult.success
          ? "Verification code sent successfully via SMS"
          : "Verification code generated (SMS service configuration issue)",
        expiresAt: new Date(expiresAt).toISOString(),
        remainingAttempts: rateLimit.remainingAttempts,
        smsSuccess: smsResult.success,
        smsError: smsResult.error,
        smsEndpoint: smsResult.endpoint,
        // Always show code for now since SMS service has configuration issues
        code: code,
        debug: {
          phone: normalizedPhone,
          smsStatus: smsResult.success ? "sent" : "failed",
          smsMessage: smsResult.message,
          smsEndpoint: smsResult.endpoint,
          note: "Code displayed due to SMS service configuration issues",
        },
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("❌ Unexpected error in SMS verification:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("📱 SMS Verification PUT request started")

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
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const { phone, code } = requestBody

    if (!phone || !code) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number and verification code are required",
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const normalizedPhone = formatPhoneNumber(phone)
    console.log("📱 Verifying code for phone:", normalizedPhone)

    const storedData = verificationCodes.get(normalizedPhone)

    if (!storedData) {
      return NextResponse.json(
        {
          success: false,
          error: "No verification code found for this phone number",
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (Date.now() > storedData.expires) {
      verificationCodes.delete(normalizedPhone)
      return NextResponse.json(
        {
          success: false,
          error: "Verification code has expired",
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (storedData.code !== code.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification code",
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    verificationCodes.delete(normalizedPhone)

    return NextResponse.json(
      {
        success: true,
        message: "Phone number verified successfully",
        verifiedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("❌ Unexpected error in code verification:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
