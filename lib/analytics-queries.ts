import { databaseService } from '@/lib/database';
import { debugLog } from '@/lib/debug-utils';

// Optimized query functions for analytics
export class OptimizedAnalyticsQueries {
  
  // Batch multiple queries for better performance
  static async getRevenueAnalyticsBatch(startDate: string, endDate: string) {
    const connection = await databaseService.getConnection();
    
    try {
      // Single query to get multiple revenue metrics
      const [revenueMetrics] = await connection.execute(`
        SELECT 
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as total_revenue,
          COUNT(CASE WHEN status != 'cancelled' THEN 1 END) as successful_orders,
          COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total END), 0) as avg_order_value,
          COALESCE(SUM(CASE WHEN status = 'cancelled' THEN total ELSE 0 END), 0) as cancelled_revenue,
          COUNT(*) as total_orders
        FROM orders 
        WHERE DATE(created_at) BETWEEN ? AND ?
      `, [startDate, endDate]);

      // Payment method breakdown in single query
      const [paymentMethods] = await connection.execute(`
        SELECT 
          payment_method,
          SUM(total) as revenue,
          COUNT(*) as orders,
          ROUND((SUM(total) / (SELECT COALESCE(SUM(total), 1) FROM orders WHERE status != 'cancelled' AND DATE(created_at) BETWEEN ? AND ?)) * 100, 2) as percentage
        FROM orders 
        WHERE status != 'cancelled' 
          AND DATE(created_at) BETWEEN ? AND ?
        GROUP BY payment_method
      `, [startDate, endDate, startDate, endDate]);

      return {
        metrics: (revenueMetrics as any)[0],
        paymentMethods: paymentMethods as any[]
      };

    } finally {
      connection.release();
    }
  }

  // Optimized product analytics with materialized view approach
  static async getProductAnalyticsOptimized(startDate: string, endDate: string) {
    const connection = await databaseService.getConnection();
    
    try {
      // Use temporary table for better performance on large datasets
      await connection.execute(`
        CREATE TEMPORARY TABLE IF NOT EXISTS temp_product_sales AS
        SELECT 
          JSON_EXTRACT(oi.flavor_details, '$[0].id') as flavor_id,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.quantity * oi.unit_price) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'cancelled' 
          AND DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY JSON_EXTRACT(oi.flavor_details, '$[0].id')
      `, [startDate, endDate]);

      // Get top sellers with flavor details
      const [topSellers] = await connection.execute(`
        SELECT 
          f.id,
          f.name,
          f.category,
          f.stock_quantity_mini,
          f.stock_quantity_medium,
          f.stock_quantity_large,
          tps.total_quantity,
          tps.total_revenue
        FROM temp_product_sales tps
        JOIN flavors f ON tps.flavor_id = f.id
        ORDER BY tps.total_revenue DESC
        LIMIT 10
      `);

      // Clean up temporary table
      await connection.execute('DROP TEMPORARY TABLE IF EXISTS temp_product_sales');

      return topSellers as any[];

    } finally {
      connection.release();
    }
  }

  // Paginated customer analytics for large datasets
  static async getCustomerAnalyticsPaginated(startDate: string, endDate: string, page: number = 1, limit: number = 50) {
    const connection = await databaseService.getConnection();
    const offset = (page - 1) * limit;
    
    try {
      // Get total count first
      const [totalCount] = await connection.execute(`
        SELECT COUNT(DISTINCT customer_id) as total
        FROM orders 
        WHERE DATE(created_at) BETWEEN ? AND ?
      `, [startDate, endDate]);

      // Get paginated customer data
      const [customers] = await connection.execute(`
        SELECT 
          c.id,
          CONCAT(c.first_name, ' ', c.last_name) as name,
          c.email,
          SUM(o.total) as total_spent,
          COUNT(o.id) as order_count,
          MAX(o.created_at) as last_order_date
        FROM customers c
        JOIN orders o ON c.id = o.customer_id
        WHERE o.status != 'cancelled'
          AND DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY c.id, c.first_name, c.last_name, c.email
        ORDER BY total_spent DESC
        LIMIT ? OFFSET ?
      `, [startDate, endDate, limit, offset]);

      return {
        customers: customers as any[],
        total: (totalCount as any)[0]?.total || 0,
        page,
        limit,
        totalPages: Math.ceil(((totalCount as any)[0]?.total || 0) / limit)
      };

    } finally {
      connection.release();
    }
  }

  // Time-series data with date bucketing for better performance
  static async getTimeSeriesData(startDate: string, endDate: string, interval: 'day' | 'week' | 'month' = 'day') {
    const connection = await databaseService.getConnection();
    
    try {
      let dateFormat: string;
      let groupBy: string;

      switch (interval) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          groupBy = 'DATE(created_at)';
          break;
        case 'week':
          dateFormat = '%Y-%u';
          groupBy = 'YEARWEEK(created_at)';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
          break;
        default:
          dateFormat = '%Y-%m-%d';
          groupBy = 'DATE(created_at)';
      }

      const [timeSeriesData] = await connection.execute(`
        SELECT 
          DATE_FORMAT(created_at, ?) as period,
          SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END) as revenue,
          COUNT(CASE WHEN status != 'cancelled' THEN 1 END) as orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
        FROM orders 
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY ${groupBy}
        ORDER BY period
      `, [dateFormat, startDate, endDate]);

      return timeSeriesData as any[];

    } finally {
      connection.release();
    }
  }
} 