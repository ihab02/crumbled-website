import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import mysql from 'mysql2/promise';
import pool from '@/lib/db';

export async function GET() {
  let connection: mysql.PoolConnection | undefined;
  try {
    // Get user from cookie
    const userCookie = cookies().get("user_session")

    if (!userCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = JSON.parse(userCookie.value)

    connection = await pool.getConnection();

    // Get user orders
    const [orders] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [user.id]
    );

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await connection!.query<mysql.RowDataPacket[]>(
          "SELECT * FROM order_items WHERE order_id = ?",
          [order.id]
        );
        return { ...order, items };
      })
    );

    return NextResponse.json({ orders: ordersWithItems })
  } catch (error) {
    console.error("Error fetching user orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
