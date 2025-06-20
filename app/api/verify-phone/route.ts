import { type NextRequest, NextResponse } from "next/server"
import { sendVerificationCode, verifyCode } from "@/lib/sms-service"

// Generate a random 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// For demo purposes only - in production, use a real SMS service
function mockSendSMS(phone: string, code: string): boolean {
  console.log(`[MOCK SMS] Sending code ${code} to ${phone}`)
  return true
}

// Simple in-memory cache for demo purposes
// In production, use Redis or another proper caching solution
const verificationCache = new Map<string, string>()

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code, action } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required",
        },
        { status: 400 },
      )
    }

    // Rate limiting check
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimitKey = `phone_verify:${ip}`
    
    // TODO: Implement proper rate limiting with Redis or similar
    // For now, we'll just log the attempt
    console.log("Rate limit check for:", rateLimitKey)

    if (action === "send") {
      // Send verification code
      await sendVerificationCode(phoneNumber)
      return NextResponse.json({
        success: true,
        message: "Verification code sent successfully",
      })
    } else if (action === "verify" && code) {
      // Verify code
      const result = await verifyCode(phoneNumber, code)
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action or missing code for verification",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error in phone verification:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process verification",
      },
      { status: 500 },
    )
  }
}
