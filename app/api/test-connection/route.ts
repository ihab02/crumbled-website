import { NextResponse } from "next/server"
import { testConnection } from '@/lib/db';

export async function GET() {
  try {
    const result = await testConnection();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Database connection successful",
        timestamp: result.timestamp,
        version: result.version,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Database connection failed",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
