import { NextResponse } from "next/server"
import { databaseService } from '@/lib/services/databaseService'

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DB_HOST: !!process.env.DB_HOST,
      DB_USER: !!process.env.DB_USER,
      DB_PASSWORD: !!process.env.DB_PASSWORD,
      DB_NAME: !!process.env.DB_NAME
    }

    // Test database connection
    const result = await databaseService.query('SELECT NOW() as current_time, VERSION() as mysql_version')

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      timestamp: result[0].current_time,
      version: result[0].mysql_version,
      environment: envCheck
    })
  } catch (error) {
    console.error('Database connection test failed:', error)
    return NextResponse.json({
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error),
      environment: envCheck
    }, { status: 500 })
  }
}
