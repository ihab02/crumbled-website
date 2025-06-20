import { NextResponse } from "next/server"
import mysql from 'mysql2/promise';
import pool from '@/lib/db';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();

    // First check if the stock table exists
    const [tableCheck] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'crumbled_nextDB' AND table_name = 'stock'"
    );

    if (tableCheck[0].count === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stock table does not exist. Please set up the database first.",
          message: "Database setup required",
        },
        { status: 404 },
      )
    }

    const [stock] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT * FROM stock ORDER BY product_name"
    );

    return NextResponse.json({ success: true, stock })
  } catch (error) {
    console.error("Error fetching stock:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stock",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function PUT(request: Request) {
  let connection;
  try {
    connection = await pool.getConnection();

    // First check if the stock table exists
    const [tableCheck] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'crumbled_nextDB' AND table_name = 'stock'"
    );

    if (tableCheck[0].count === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stock table does not exist. Please set up the database first.",
        },
        { status: 400 },
      )
    }

    const data = await request.json()
    const { productId, quantity } = data

    if (!productId || quantity === undefined) {
      return NextResponse.json({ success: false, error: "Product ID and quantity are required" }, { status: 400 })
    }

    await connection.query(
      "UPDATE stock SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?",
      [quantity, productId]
    );

    return NextResponse.json({
      success: true,
      message: "Stock updated successfully",
    })
  } catch (error) {
    console.error("Error updating stock:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update stock",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
