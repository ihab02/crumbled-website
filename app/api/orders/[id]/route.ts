import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import mysql from 'mysql2/promise';
import pool from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    const orderId = Number.parseInt(params.id)

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    // Get user from cookie
    const userCookie = cookies().get("user_session")

    if (!userCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = JSON.parse(userCookie.value)

    connection = await pool.getConnection();

    // Get order details
    const [orderResult] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT * FROM orders WHERE id = ? AND user_id = ?",
      [orderId, user.id]
    );

    if (orderResult.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = orderResult[0]

    // Get order items
    const [itemsResult] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT * FROM order_items WHERE order_id = ?",
      [orderId]
    );

    return NextResponse.json({
      success: true,
      order,
      items: itemsResult,
    })
  } catch (error) {
    console.error("Error fetching order details:", error)
    return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 })
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
