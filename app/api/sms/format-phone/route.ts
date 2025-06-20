import { type NextRequest, NextResponse } from "next/server"

function formatPhoneNumber(phone: string): { formatted: string; steps: string[] } {
  const steps: string[] = []
  let cleaned = phone.replace(/[^\d+]/g, "")
  steps.push(`Original: "${phone}" -> Cleaned: "${cleaned}"`)

  // Handle different Egyptian phone number formats
  if (cleaned.startsWith("+20")) {
    cleaned = cleaned.substring(3)
    steps.push(`Removed +20 prefix: "${cleaned}"`)
  } else if (cleaned.startsWith("20")) {
    cleaned = cleaned.substring(2)
    steps.push(`Removed 20 prefix: "${cleaned}"`)
  }

  // Ensure it starts with 0 for Egyptian format
  if (!cleaned.startsWith("0")) {
    cleaned = "0" + cleaned
    steps.push(`Added leading 0: "${cleaned}"`)
  }

  // Validate Egyptian mobile number format (11 digits starting with 01)
  if (cleaned.length === 11 && cleaned.startsWith("01")) {
    steps.push(`✅ Valid Egyptian mobile format: "${cleaned}"`)
  } else if (cleaned.length === 10 && cleaned.startsWith("1")) {
    const formatted = "0" + cleaned
    steps.push(`✅ Added 0 to 10-digit number: "${formatted}"`)
    cleaned = formatted
  } else {
    steps.push(`⚠️ Using as-is (might not be standard Egyptian format): "${cleaned}"`)
  }

  return { formatted: cleaned, steps }
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 })
    }

    const result = formatPhoneNumber(phone)

    return NextResponse.json({
      success: true,
      original: phone,
      formatted: result.formatted,
      steps: result.steps,
      isValid: result.formatted.length === 11 && result.formatted.startsWith("01"),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
