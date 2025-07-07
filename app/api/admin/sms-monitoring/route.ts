import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

// JWT verification function (simplified version for admin routes)
async function verifyAdminJWT(token: string): Promise<boolean> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    if (!headerB64 || !payloadB64 || !signatureB64) {
      return false;
    }
    
    // Decode payload
    const payload = JSON.parse(atob(payloadB64));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }

    // Check if it's an admin token
    return payload.type === 'admin';
  } catch (error) {
    console.error('Admin JWT verification error:', error);
    return false;
  }
}

export async function GET(request: Request) {
  let connection;
  try {
    // Check admin authentication using JWT token
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('adminToken');
    
    let isAdmin = false;
    if (adminToken?.value) {
      isAdmin = await verifyAdminJWT(adminToken.value);
    }
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    connection = await pool.getConnection();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h'; // Default to last 24 hours
    const phone = searchParams.get('phone');

    // Calculate time range based on period
    let timeRange;
    switch (period) {
      case '24h':
        timeRange = 'INTERVAL 24 HOUR';
        break;
      case '7d':
        timeRange = 'INTERVAL 7 DAY';
        break;
      case '30d':
        timeRange = 'INTERVAL 30 DAY';
        break;
      default:
        timeRange = 'INTERVAL 24 HOUR';
    }

    // Get SMS statistics
    let statsQuery;
    if (phone) {
      const [stats] = await connection.query(
        `SELECT 
          COUNT(*) as total_sent,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          AVG(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100 as success_rate
        FROM sms_logs
        WHERE created_at >= NOW() - ${timeRange}
        AND phone = ?`,
        [phone]
      );
      statsQuery = stats[0];
    } else {
      const [stats] = await connection.query(
        `SELECT 
          COUNT(*) as total_sent,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          AVG(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100 as success_rate
        FROM sms_logs
        WHERE created_at >= NOW() - ${timeRange}`
      );
      statsQuery = stats[0];
    }

    // Get rate limit statistics
    const [rateLimits] = await connection.query(
      `SELECT 
        COUNT(*) as total_limited,
        COUNT(DISTINCT phone) as unique_limited_phones
      FROM sms_rate_limits
      WHERE reset_time > NOW()`
    );

    // Get top error messages
    const [errors] = await connection.query(
      `SELECT 
        error_message,
        COUNT(*) as count
      FROM sms_logs
      WHERE status = 'failed'
      AND created_at >= NOW() - ${timeRange}
      GROUP BY error_message
      ORDER BY count DESC
      LIMIT 5`
    );

    // Get hourly distribution (MySQL equivalent of DATE_TRUNC)
    const [hourly] = await connection.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful
      FROM sms_logs
      WHERE created_at >= NOW() - ${timeRange}
      GROUP BY hour
      ORDER BY hour DESC
      LIMIT 24`
    );

    return NextResponse.json({
      stats: statsQuery,
      rateLimits: rateLimits[0],
      topErrors: errors,
      hourlyDistribution: hourly,
      period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('SMS monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS monitoring data' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 