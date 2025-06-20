import { type NextRequest, NextResponse } from "next/server"
import { getOrderByTracking } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get("email")
    const trackingId = searchParams.get("tracking")

    if (!email || !trackingId) {
      return NextResponse.json({ success: false, error: "Email and tracking ID are required" }, { status: 400 })
    }

    const result = await getOrderByTracking(trackingId, email)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Order not found" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error tracking order:", error)
    return NextResponse.json({ success: false, error: "Failed to track order" }, { status: 500 })
  }
}
