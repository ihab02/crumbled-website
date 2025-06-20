import { NextResponse } from "next/server"
import { databaseService } from '@/lib/services/databaseService'

export async function GET() {
  try {
    // Test database connection
    await databaseService.query('SELECT 1')
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
