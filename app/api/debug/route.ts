import { NextResponse } from "next/server"

export async function GET() {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
        DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 20) + "..." || "Not set",
      },
      neonPackage: {
        available: false,
        error: null,
      },
      connection: {
        tested: false,
        success: false,
        error: null,
        tables: [],
      },
    }

    // Test Neon package import
    // const { neon } = await import("@neondatabase/serverless")
    // const sql = neon(process.env.DATABASE_URL)

    return NextResponse.json(debugInfo)
  } catch (error) {
    return NextResponse.json({
      error: "Debug API failed",
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
