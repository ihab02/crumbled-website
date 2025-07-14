import { NextResponse } from "next/server"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
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

    // Get all unique order statuses for this user
    const statusesResult = await db.query(
      `SELECT DISTINCT status FROM orders WHERE customer_id = ? ORDER BY status`,
      [userId]
    );

    // Get sample orders with their statuses
    const sampleOrders = await db.query(
      `SELECT id, status, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      uniqueStatuses: statusesResult || [],
      sampleOrders: sampleOrders || [],
      totalOrders: sampleOrders?.length || 0
    });
  } catch (error) {
    console.error("Error fetching order statuses:", error)
    return NextResponse.json({ error: "Failed to fetch order statuses" }, { status: 500 })
  }
} 