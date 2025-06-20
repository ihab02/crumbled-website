import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    const schemaInfo: Record<string, string[]> = {}

    // Get columns for each table
    for (const table of tables) {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${table.table_name}
        ORDER BY ordinal_position
      `

      schemaInfo[table.table_name] = columns.map(
        (col) => `${col.column_name} (${col.data_type}${col.is_nullable === "YES" ? ", nullable" : ""})`,
      )
    }

    return NextResponse.json({
      success: true,
      tables: tables.map((t) => t.table_name),
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
