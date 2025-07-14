import { NextResponse } from "next/server"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';

export async function POST() {
  try {
    // Check authentication using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = databaseService
    
    // Get user ID
    const userResult = await db.query(
      'SELECT id FROM customers WHERE email = ?',
      [session.user.email]
    );

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = userResult[0].id;

    // Update the 5 oldest orders to "delivered" status
    const updateResult = await db.query(
      `UPDATE orders 
       SET status = 'delivered' 
       WHERE customer_id = ? 
       ORDER BY created_at ASC 
       LIMIT 5`,
      [userId]
    );

    // Update 2 more orders to "cancelled" status
    const cancelResult = await db.query(
      `UPDATE orders 
       SET status = 'cancelled' 
       WHERE customer_id = ? AND status != 'delivered'
       ORDER BY created_at ASC 
       LIMIT 2`,
      [userId]
    );

    // Get updated statuses
    const statusesResult = await db.query(
      `SELECT DISTINCT status FROM orders WHERE customer_id = ? ORDER BY status`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: "Updated order statuses for testing",
      uniqueStatuses: statusesResult || [],
      updatedOrders: (updateResult as any)?.affectedRows || 0,
      cancelledOrders: (cancelResult as any)?.affectedRows || 0
    });
  } catch (error) {
    console.error("Error updating order statuses:", error)
    return NextResponse.json({ error: "Failed to update order statuses" }, { status: 500 })
  }
} 