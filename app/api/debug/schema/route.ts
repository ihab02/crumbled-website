import { NextResponse } from "next/server"
import { databaseService } from '@/lib/services/databaseService'

export async function GET() {
  try {
    // Get all tables
    const tables = await databaseService.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'crumbled_nextDB'
      ORDER BY table_name
    `)

    const schemaInfo: Record<string, string[]> = {}

    // Get columns for each table
    for (const table of tables) {
      const columns = await databaseService.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'crumbled_nextDB' 
        AND table_name = ?
        ORDER BY ordinal_position
      `, [table.table_name])

      schemaInfo[table.table_name] = columns.map(
        (col: any) => `${col.column_name} (${col.data_type}${col.is_nullable === "YES" ? ", nullable" : ""})`,
      )
    }

    return NextResponse.json({
      success: true,
      tables: tables.map((t: any) => t.table_name),
      schema: schemaInfo,
    })
  } catch (error) {
    console.error("Error inspecting schema:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to inspect schema",
      },
      { status: 500 },
    )
  }
}
