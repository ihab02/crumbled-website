import { NextResponse } from "next/server"
import mysql from 'mysql2/promise';
import pool from '@/lib/db';
// This file is not used. Remove or update as needed.
// import { sql } from "@neondatabase/serverless"

export async function GET() {
  let connection;
  try {
    // Test basic connection
    console.log("Testing database connection...")

    connection = await pool.getConnection();

    // Simple query to test connection
    const [result] = await connection.query<mysql.RowDataPacket[]>("SELECT 1 as test");
    console.log("Basic connection test passed:", result);

    // Test if we can query information schema
    const [tables] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'crumbled_nextDB'"
    );
    console.log("Available tables:", tables);

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      tables: tables.map((t) => t.table_name),
    })
  } catch (error) {
    console.error("Database connection test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 },
    )
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
