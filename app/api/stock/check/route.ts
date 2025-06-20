import { type NextRequest, NextResponse } from "next/server"
import mysql from 'mysql2/promise';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  let connection;
  try {
    connection = await pool.getConnection();

    const { items } = await request.json()

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid items data",
        },
        { status: 400 },
      )
    }

    const stockIssues = []

    for (const item of items) {
      if (!item.isBundle) {
        // Check stock for regular items
        const [stockCheck] = await connection.query<mysql.RowDataPacket[]>(
          "SELECT quantity, product_name FROM stock WHERE product_id = ?",
          [item.id]
        );

        if (stockCheck.length === 0) {
          stockIssues.push({
            productId: item.id,
            productName: item.name,
            issue: "Product not found in stock",
            available: 0,
            requested: item.quantity,
          })
        } else if (stockCheck[0].quantity < item.quantity) {
          stockIssues.push({
            productId: item.id,
            productName: item.name,
            issue: "Insufficient stock",
            available: stockCheck[0].quantity,
            requested: item.quantity,
          })
        }
      } else {
        // Check stock for bundle items
        if (item.bundleItems && Array.isArray(item.bundleItems)) {
          for (const bundleItem of item.bundleItems) {
            const [stockCheck] = await connection.query<mysql.RowDataPacket[]>(
              "SELECT quantity, product_name FROM stock WHERE product_id = ?",
              [bundleItem.id]
            );

            if (stockCheck.length === 0) {
              stockIssues.push({
                productId: bundleItem.id,
                productName: bundleItem.name,
                issue: "Bundle item not found in stock",
                available: 0,
                requested: item.quantity,
                bundleName: item.name,
              })
            } else if (stockCheck[0].quantity < item.quantity) {
              stockIssues.push({
                productId: bundleItem.id,
                productName: bundleItem.name,
                issue: "Insufficient stock for bundle item",
                available: stockCheck[0].quantity,
                requested: item.quantity,
                bundleName: item.name,
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: stockIssues.length === 0,
      stockIssues,
      message: stockIssues.length === 0 ? "All items are in stock" : "Some items have stock issues",
    })
  } catch (error) {
    console.error("Error checking stock:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to check stock: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
