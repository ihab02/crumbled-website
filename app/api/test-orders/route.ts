import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: "Test orders API is working",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error in test orders API:", error)
    return NextResponse.json({ 
      success: false,
      error: "Test API failed" 
    }, { status: 500 })
  }
} 