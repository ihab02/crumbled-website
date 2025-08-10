import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { adminAuth } from '@/lib/middleware/auth';
import { debugLog } from '@/lib/debug-utils';
import { analyticsCache } from '@/lib/analytics-cache';
// Option A: use databaseService.transaction consistently (no direct pool usage)

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await adminAuth(request);
    if (authResult) {
      // authResult is a NextResponse (error case)
      return authResult;
    }

    // Get admin info from headers (set by adminAuth)
    const adminUsername = request.headers.get('x-admin-username');
    const adminEmail = request.headers.get('x-admin-email');

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'this-month';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');
    
    await debugLog('Sales Analytics API called', { range, adminUsername, adminEmail, customStartDate, customEndDate });

    // Check cache first
    const cacheKey = analyticsCache.generateKey(range, adminUsername || 'admin', customStartDate, customEndDate);
    const cachedData = await analyticsCache.get(cacheKey);
    
    if (cachedData) {
      await debugLog('Returning cached analytics data', { range, adminUsername });
      return NextResponse.json(cachedData);
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    
    // Handle custom date range
    if (range === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      
      // Validate custom date range
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      
      if (startDate > endDate) {
        return NextResponse.json({ error: 'Start date cannot be after end date' }, { status: 400 });
      }
      
      // Limit custom range to maximum 2 years
      const maxDateRange = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years in milliseconds
      if (endDate.getTime() - startDate.getTime() > maxDateRange) {
        return NextResponse.json({ error: 'Date range cannot exceed 2 years' }, { status: 400 });
      }
    } else {
      switch (range) {
        case 'this-week':
          // Get the start of the current week (Sunday)
          const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const daysToSubtract = dayOfWeek; // Days to go back to Sunday
          startDate = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
          startDate.setHours(0, 0, 0, 0); // Start of day
          break;
        case 'this-month':
          // Get the start of the current month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0); // Start of day
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    await debugLog('Calculated date range', { startDate: startDateStr, endDate: endDateStr });

    // Get revenue analytics
    const revenueData = await getRevenueAnalytics(startDateStr, endDateStr);
    
    // Get order analytics
    const orderData = await getOrderAnalytics(startDateStr, endDateStr);
    
    // Get product analytics
    const productData = await getProductAnalytics(startDateStr, endDateStr);
    
    // Get customer analytics
    const customerData = await getCustomerAnalytics(startDateStr, endDateStr);
    
    // Get delivery analytics
    const deliveryData = await getDeliveryAnalytics(startDateStr, endDateStr);
    
    // Get promotion analytics
    const promotionData = await getPromotionAnalytics(startDateStr, endDateStr);

    const analyticsData = {
      revenue: revenueData,
      orders: orderData,
      products: productData,
      customers: customerData,
      delivery: deliveryData,
      promotions: promotionData,
    };

    await debugLog('Analytics data prepared', { 
      revenueTotal: revenueData.total,
      ordersTotal: orderData.total,
      productsCount: productData.topSellers.length,
      customersTotal: customerData.total
    });

    // Cache the result
    analyticsCache.set(cacheKey, analyticsData);

    return NextResponse.json(analyticsData);

  } catch (error) {
    await debugLog('Sales Analytics API error', { error: error instanceof Error ? error.message : 'Unknown error' });
    console.error('Sales Analytics API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getRevenueAnalytics(startDate: string, endDate: string) {
  return await databaseService.transaction(async (connection) => {
    // Total revenue and growth
    const [totalRevenueResult] = await connection.execute(`
      SELECT 
        COALESCE(SUM(total), 0) as total_revenue,
        COUNT(*) as total_orders,
        COALESCE(AVG(total), 0) as avg_order_value
      FROM orders 
      WHERE status != 'cancelled' 
        AND DATE(created_at) BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Previous period for growth calculation
    const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(new Date(startDate).getTime() - daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const prevEndDate = new Date(new Date(endDate).getTime() - daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [prevRevenueResult] = await connection.execute(`
      SELECT COALESCE(SUM(total), 0) as prev_revenue
      FROM orders 
      WHERE status != 'cancelled' 
        AND DATE(created_at) BETWEEN ? AND ?
    `, [prevStartDate, prevEndDate]);

    const totalRevenue = (totalRevenueResult as any)[0]?.total_revenue || 0;
    const prevRevenue = (prevRevenueResult as any)[0]?.prev_revenue || 0;
    const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Revenue by payment method
    const [paymentMethodResult] = await connection.execute(`
      SELECT 
        payment_method,
        SUM(total) as revenue,
        COUNT(*) as orders
      FROM orders 
      WHERE status != 'cancelled' 
        AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY payment_method
    `, [startDate, endDate]);

    // Revenue by zone
    const [zoneResult] = await connection.execute(`
      SELECT 
        z.name as zone_name,
        SUM(o.total) as revenue,
        COUNT(o.id) as orders
      FROM orders o
      JOIN zones z ON o.delivery_zone_id = z.id
      WHERE o.status != 'cancelled' 
        AND DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY z.id, z.name
      ORDER BY revenue DESC
    `, [startDate, endDate]);

    // Daily revenue for chart
    const [dailyRevenueResult] = await connection.execute(`
      SELECT 
        DATE(created_at) as date,
        SUM(total) as revenue,
        COUNT(*) as orders
      FROM orders 
      WHERE status != 'cancelled' 
        AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [startDate, endDate]);

    return {
      total: totalRevenue,
      growth: Math.round(growth * 100) / 100,
      averageOrderValue: Math.round(((totalRevenueResult as any)[0]?.avg_order_value || 0) * 100) / 100,
      byPeriod: (dailyRevenueResult as any[]).map(row => ({
        date: row.date,
        revenue: row.revenue,
        orders: row.orders
      })),
      byPaymentMethod: (paymentMethodResult as any[]).map(row => ({
        method: row.payment_method === 'cod' ? 'Cash on Delivery' : 'Paymob',
        revenue: row.revenue,
        percentage: Math.round((row.revenue / totalRevenue) * 100)
      })),
      byZone: (zoneResult as any[]).map(row => ({
        zone: row.zone_name,
        revenue: row.revenue,
        orders: row.orders
      }))
    };
  });
}

async function getOrderAnalytics(startDate: string, endDate: string) {
  return await databaseService.transaction(async (connection) => {
    // Total orders and growth
    const [totalOrdersResult] = await connection.execute(`
      SELECT COUNT(*) as total_orders
      FROM orders 
      WHERE DATE(created_at) BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Previous period for growth
    const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(new Date(startDate).getTime() - daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const prevEndDate = new Date(new Date(endDate).getTime() - daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [prevOrdersResult] = await connection.execute(`
      SELECT COUNT(*) as prev_orders
      FROM orders 
      WHERE DATE(created_at) BETWEEN ? AND ?
    `, [prevStartDate, prevEndDate]);

    const totalOrders = (totalOrdersResult as any)[0]?.total_orders || 0;
    const prevOrders = (prevOrdersResult as any)[0]?.prev_orders || 0;
    const growth = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0;

    // Orders by status
    const [statusResult] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders 
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY status
    `, [startDate, endDate]);

    const totalOrdersForPercentage = totalOrders;
    const statusData = (statusResult as any[]).map(row => ({
      status: row.status,
      count: row.count,
      percentage: Math.round((row.count / totalOrdersForPercentage) * 100)
    }));

    // Calculate completion and cancellation rates
    const deliveredOrders = statusData.find(s => s.status === 'delivered')?.count || 0;
    const cancelledOrders = statusData.find(s => s.status === 'cancelled')?.count || 0;
    const completionRate = totalOrdersForPercentage > 0 ? (deliveredOrders / totalOrdersForPercentage) * 100 : 0;
    const cancellationRate = totalOrdersForPercentage > 0 ? (cancelledOrders / totalOrdersForPercentage) * 100 : 0;

    // Orders by hour
    const [hourResult] = await connection.execute(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as orders
      FROM orders 
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `, [startDate, endDate]);

    return {
      total: totalOrders,
      growth: Math.round(growth * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      byStatus: statusData,
      byHour: (hourResult as any[]).map(row => ({
        hour: row.hour,
        orders: row.orders
      }))
    };
  });
}

async function getProductAnalytics(startDate: string, endDate: string) {
  return await databaseService.transaction(async (connection) => {
    // Top selling products
    const [topSellersResult] = await connection.execute(`
      SELECT 
        f.id,
        f.name,
        f.category,
        f.stock_quantity_mini,
        f.stock_quantity_medium,
        f.stock_quantity_large,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * oi.unit_price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN flavors f ON JSON_EXTRACT(oi.flavor_details, '$[0].id') = f.id
      WHERE o.status != 'cancelled' 
        AND DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY f.id, f.name, f.category
      ORDER BY total_revenue DESC
      LIMIT 10
    `, [startDate, endDate]);

    // Products by category
    const [categoryResult] = await connection.execute(`
      SELECT 
        f.category,
        SUM(oi.quantity * oi.unit_price) as revenue,
        COUNT(DISTINCT o.id) as orders
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN flavors f ON JSON_EXTRACT(oi.flavor_details, '$[0].id') = f.id
      WHERE o.status != 'cancelled' 
        AND DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY f.category
      ORDER BY revenue DESC
    `, [startDate, endDate]);

    // Stock alerts (low stock products)
    const [stockAlertsResult] = await connection.execute(`
      SELECT 
        id,
        name,
        (stock_quantity_mini + stock_quantity_medium + stock_quantity_large) as current_stock
      FROM flavors
      WHERE is_active = 1 AND is_enabled = 1
        AND (stock_quantity_mini + stock_quantity_medium + stock_quantity_large) <= 10
      ORDER BY current_stock ASC
      LIMIT 10
    `);

    return {
      topSellers: (topSellersResult as any[]).map(row => {
        const totalStock = (row.stock_quantity_mini || 0) + (row.stock_quantity_medium || 0) + (row.stock_quantity_large || 0);
        let stockLevel: 'in_stock' | 'low_stock' | 'out_of_stock';
        
        if (totalStock === 0) stockLevel = 'out_of_stock';
        else if (totalStock <= 10) stockLevel = 'low_stock';
        else stockLevel = 'in_stock';

        return {
          id: row.id,
          name: row.name,
          category: row.category,
          revenue: row.total_revenue,
          quantity: row.total_quantity,
          stockLevel
        };
      }),
      byCategory: (categoryResult as any[]).map(row => ({
        category: row.category,
        revenue: row.revenue,
        orders: row.orders
      })),
      stockAlerts: (stockAlertsResult as any[]).map(row => ({
        id: row.id,
        name: row.name,
        currentStock: row.current_stock,
        recommendedReorder: Math.max(50, row.current_stock * 2)
      }))
    };
  });
}

async function getCustomerAnalytics(startDate: string, endDate: string) {
  return await databaseService.transaction(async (connection) => {
    // Total customers
    const [totalCustomersResult] = await connection.execute(`
      SELECT COUNT(DISTINCT customer_id) as total_customers
      FROM orders 
      WHERE DATE(created_at) BETWEEN ? AND ?
    `, [startDate, endDate]);

    // New customers (first order in this period)
    const [newCustomersResult] = await connection.execute(`
      SELECT COUNT(DISTINCT customer_id) as new_customers
      FROM orders o1
      WHERE DATE(o1.created_at) BETWEEN ? AND ?
        AND NOT EXISTS (
          SELECT 1 FROM orders o2 
          WHERE o2.customer_id = o1.customer_id 
            AND DATE(o2.created_at) < ?
        )
    `, [startDate, endDate, startDate]);

    // Returning customers
    const [returningCustomersResult] = await connection.execute(`
      SELECT COUNT(DISTINCT customer_id) as returning_customers
      FROM orders o1
      WHERE DATE(o1.created_at) BETWEEN ? AND ?
        AND EXISTS (
          SELECT 1 FROM orders o2 
          WHERE o2.customer_id = o1.customer_id 
            AND DATE(o2.created_at) < ?
        )
    `, [startDate, endDate, startDate]);

    // Average CLV
    const [clvResult] = await connection.execute(`
      SELECT AVG(customer_total) as avg_clv
      FROM (
        SELECT 
          customer_id,
          SUM(total) as customer_total
        FROM orders 
        WHERE status != 'cancelled'
        GROUP BY customer_id
      ) as customer_totals
    `);

    // Top customers
    const [topCustomersResult] = await connection.execute(`
      SELECT 
        c.id,
        CONCAT(c.first_name, ' ', c.last_name) as name,
        c.email,
        SUM(o.total) as total_spent,
        COUNT(o.id) as order_count
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      WHERE o.status != 'cancelled'
      GROUP BY c.id, c.first_name, c.last_name, c.email
      ORDER BY total_spent DESC
      LIMIT 10
    `);

    return {
      total: (totalCustomersResult as any)[0]?.total_customers || 0,
      newCustomers: (newCustomersResult as any)[0]?.new_customers || 0,
      returningCustomers: (returningCustomersResult as any)[0]?.returning_customers || 0,
      averageCLV: Math.round(((clvResult as any)[0]?.avg_clv || 0) * 100) / 100,
      topCustomers: (topCustomersResult as any[]).map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        totalSpent: row.total_spent,
        orderCount: row.order_count
      }))
    };
  });
}

async function getDeliveryAnalytics(startDate: string, endDate: string) {
  return await databaseService.transaction(async (connection) => {
    // Zone performance
    const [zonePerformanceResult] = await connection.execute(`
      SELECT 
        z.name as zone_name,
        SUM(o.total) as revenue,
        COUNT(o.id) as orders,
        AVG(TIMESTAMPDIFF(MINUTE, o.created_at, o.updated_at)) as avg_delivery_time
      FROM orders o
      JOIN zones z ON o.delivery_zone_id = z.id
      WHERE o.status = 'delivered' 
        AND DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY z.id, z.name
      ORDER BY revenue DESC
    `, [startDate, endDate]);

    return {
      zonePerformance: (zonePerformanceResult as any[]).map(row => ({
        zone: row.zone_name,
        revenue: row.revenue,
        orders: row.orders,
        averageDeliveryTime: Math.round(row.avg_delivery_time || 0)
      }))
    };
  });
}

async function getPromotionAnalytics(startDate: string, endDate: string) {
  return await databaseService.transaction(async (connection) => {
    // Total discounts
    const [totalDiscountsResult] = await connection.execute(`
      SELECT COALESCE(SUM(discount_amount), 0) as total_discounts
      FROM orders 
      WHERE status != 'cancelled' 
        AND DATE(created_at) BETWEEN ? AND ?
        AND discount_amount > 0
    `, [startDate, endDate]);

    // Promo code usage
    const [promoUsageResult] = await connection.execute(`
      SELECT 
        pc.code,
        COUNT(pcu.id) as usage_count,
        SUM(o.total) as revenue_generated
      FROM promo_codes pc
      LEFT JOIN promo_code_usages pcu ON pc.id = pcu.promo_code_id
      LEFT JOIN orders o ON pcu.order_id = o.id
      WHERE DATE(pcu.created_at) BETWEEN ? AND ?
        AND o.status != 'cancelled'
      GROUP BY pc.id, pc.code
      ORDER BY usage_count DESC
      LIMIT 10
    `, [startDate, endDate]);

    return {
      totalDiscounts: (totalDiscountsResult as any)[0]?.total_discounts || 0,
      promoCodeUsage: (promoUsageResult as any[]).map(row => ({
        code: row.code,
        usage: row.usage_count,
        revenueGenerated: row.revenue_generated
      }))
    };
  });
} 