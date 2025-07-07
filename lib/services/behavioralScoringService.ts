import { databaseService } from './databaseService';

export interface CustomerBehavior {
  purchaseFrequency: number; // orders per month
  averageOrderValue: number;
  favoriteCategories: string[];
  preferredDeliveryTime: string;
  engagementLevel: 'high' | 'medium' | 'low';
  churnRisk: number; // 0-100
  lifetimeValue: number;
  daysSinceLastActivity: number;
  totalOrders: number;
  engagementScore: number;
}

export enum CustomerSegment {
  HIGH_VALUE_FREQUENT = 'high_value_frequent',
  HIGH_VALUE_INFREQUENT = 'high_value_infrequent', 
  MEDIUM_VALUE_REGULAR = 'medium_value_regular',
  LOW_VALUE_AT_RISK = 'low_value_at_risk',
  NEW_CUSTOMER = 'new_customer',
  CHURNED = 'churned',
  LOYAL = 'loyal'
}

export class BehavioralScoringService {
  
  /**
   * Calculate comprehensive behavioral metrics for a customer
   */
  static async calculateCustomerBehavior(customerId: number): Promise<CustomerBehavior> {
    try {
      // Get customer data
      const customerResult = await databaseService.query(
        `SELECT 
          c.*,
          COUNT(o.id) as total_orders,
          AVG(o.total) as avg_order_value,
          SUM(o.total) as lifetime_value,
          MAX(o.created_at) as last_order_date,
          MIN(o.created_at) as first_order_date,
          DATEDIFF(NOW(), MAX(o.created_at)) as days_since_last_order
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        WHERE c.id = ?
        GROUP BY c.id`,
        [customerId]
      );

      const customer = Array.isArray(customerResult) ? customerResult[0] : customerResult;
      
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get order history for detailed analysis
      const ordersResult = await databaseService.query(
        `SELECT 
          o.*,
          oi.product_id,
          p.name as product_name,
          p.product_type_id,
          pt.name as product_type_name
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN product_types pt ON p.product_type_id = pt.id
        WHERE o.customer_id = ?
        ORDER BY o.created_at DESC`,
        [customerId]
      );

      const orders = Array.isArray(ordersResult) ? ordersResult : [];

      // Calculate purchase frequency (orders per month)
      const purchaseFrequency = this.calculatePurchaseFrequency(orders);

      // Calculate average order value
      const averageOrderValue = customer.avg_order_value || 0;

      // Get favorite categories
      const favoriteCategories = this.getFavoriteCategories(orders);

      // Get preferred delivery time
      const preferredDeliveryTime = this.getPreferredDeliveryTime(orders);

      // Calculate engagement level
      const engagementLevel = this.calculateEngagementLevel(customer);

      // Calculate churn risk
      const churnRisk = this.calculateChurnRisk(customer, orders);

      return {
        purchaseFrequency,
        averageOrderValue,
        favoriteCategories,
        preferredDeliveryTime,
        engagementLevel,
        churnRisk,
        lifetimeValue: customer.lifetime_value || 0,
        daysSinceLastActivity: customer.days_since_last_order || 0,
        totalOrders: customer.total_orders || 0,
        engagementScore: customer.engagement_score || 0
      };
    } catch (error) {
      console.error('Error calculating customer behavior:', error);
      throw error;
    }
  }

  /**
   * Segment customer based on behavioral metrics
   */
  static segmentCustomer(behavior: CustomerBehavior): CustomerSegment {
    const { purchaseFrequency, averageOrderValue, churnRisk, totalOrders, lifetimeValue } = behavior;

    // High value frequent customers
    if (purchaseFrequency >= 2 && averageOrderValue >= 200 && lifetimeValue >= 1000) {
      return CustomerSegment.HIGH_VALUE_FREQUENT;
    }

    // High value infrequent customers
    if (averageOrderValue >= 200 && lifetimeValue >= 1000 && purchaseFrequency < 2) {
      return CustomerSegment.HIGH_VALUE_INFREQUENT;
    }

    // Loyal customers
    if (totalOrders >= 5 && churnRisk < 30 && behavior.engagementScore >= 70) {
      return CustomerSegment.LOYAL;
    }

    // At risk customers
    if (churnRisk > 70 && totalOrders > 0) {
      return CustomerSegment.LOW_VALUE_AT_RISK;
    }

    // New customers
    if (totalOrders <= 2 && behavior.daysSinceLastActivity < 30) {
      return CustomerSegment.NEW_CUSTOMER;
    }

    // Churned customers
    if (behavior.daysSinceLastActivity > 90 && totalOrders > 0) {
      return CustomerSegment.CHURNED;
    }

    // Default to medium value regular
    return CustomerSegment.MEDIUM_VALUE_REGULAR;
  }

  /**
   * Get personalized product recommendations
   */
  static async getPersonalizedRecommendations(customerId: number, limit: number = 6): Promise<any[]> {
    try {
      const behavior = await this.calculateCustomerBehavior(customerId);
      
      // Get products from favorite categories
      let recommendations = await this.getProductsByCategories(behavior.favoriteCategories);
      
      // Add complementary products based on purchase history
      const complementaryProducts = await this.getComplementaryProducts(customerId);
      recommendations = [...recommendations, ...complementaryProducts];
      
      // Filter by customer's price sensitivity
      const priceRange = this.getPriceRange(behavior.averageOrderValue);
      recommendations = recommendations.filter(p => 
        p.base_price >= priceRange.min && p.base_price <= priceRange.max
      );
      
      // Remove duplicates and limit results
      const uniqueRecommendations = recommendations.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      );
      
      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  /**
   * Update customer behavioral metrics
   */
  static async updateCustomerBehavior(customerId: number): Promise<void> {
    try {
      const behavior = await this.calculateCustomerBehavior(customerId);
      const segment = this.segmentCustomer(behavior);

      // Update customer record with new behavioral data
      await databaseService.query(
        `UPDATE customers SET 
          average_order_value = ?,
          customer_segment = ?,
          churn_risk_score = ?,
          lifetime_value = ?,
          days_since_last_activity = ?,
          engagement_score = ?,
          customer_lifecycle_stage = CASE 
            WHEN ? = 'churned' THEN 'churned'
            WHEN ? = 'new_customer' THEN 'new'
            WHEN ? = 'loyal' THEN 'active'
            ELSE customer_lifecycle_stage
          END
        WHERE id = ?`,
        [
          behavior.averageOrderValue,
          segment,
          behavior.churnRisk / 100, // Convert to decimal
          behavior.lifetimeValue,
          behavior.daysSinceLastActivity,
          behavior.engagementScore,
          segment,
          segment,
          segment,
          customerId
        ]
      );

      // Log the behavior update
      await databaseService.query(
        `INSERT INTO customer_behavior_logs (customer_id, behavior_type, behavior_data)
         VALUES (?, 'behavior_update', ?)`,
        [customerId, JSON.stringify(behavior)]
      );

    } catch (error) {
      console.error('Error updating customer behavior:', error);
      throw error;
    }
  }

  /**
   * Get customers by segment for targeted campaigns
   */
  static async getCustomersBySegment(segment: CustomerSegment, limit: number = 100): Promise<any[]> {
    try {
      let query = '';
      let params: any[] = [];

      switch (segment) {
        case CustomerSegment.HIGH_VALUE_FREQUENT:
          query = `
            SELECT * FROM customers 
            WHERE customer_segment = 'high_value' 
            AND average_order_value >= 200 
            AND total_orders >= 5
            ORDER BY lifetime_value DESC
            LIMIT ?
          `;
          break;

        case CustomerSegment.AT_RISK:
          query = `
            SELECT * FROM customers 
            WHERE churn_risk_score > 0.7 
            AND total_orders > 0
            ORDER BY churn_risk_score DESC
            LIMIT ?
          `;
          break;

        case CustomerSegment.NEW_CUSTOMER:
          query = `
            SELECT * FROM customers 
            WHERE customer_lifecycle_stage = 'new' 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY created_at DESC
            LIMIT ?
          `;
          break;

        case CustomerSegment.LOYAL:
          query = `
            SELECT * FROM customers 
            WHERE loyalty_tier IN ('gold', 'platinum') 
            AND engagement_score >= 70
            ORDER BY engagement_score DESC
            LIMIT ?
          `;
          break;

        default:
          query = `
            SELECT * FROM customers 
            WHERE customer_segment = ?
            ORDER BY last_order_date DESC
            LIMIT ?
          `;
          params = [segment, limit];
      }

      const result = await databaseService.query(query, params);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting customers by segment:', error);
      return [];
    }
  }

  // Private helper methods
  private static calculatePurchaseFrequency(orders: any[]): number {
    if (orders.length === 0) return 0;
    
    const firstOrder = new Date(orders[orders.length - 1].created_at);
    const lastOrder = new Date(orders[0].created_at);
    const monthsDiff = (lastOrder.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    return monthsDiff > 0 ? orders.length / monthsDiff : orders.length;
  }

  private static getFavoriteCategories(orders: any[]): string[] {
    const categoryCount = new Map<string, number>();
    
    orders.forEach(order => {
      if (order.product_type_name) {
        categoryCount.set(order.product_type_name, (categoryCount.get(order.product_type_name) || 0) + 1);
      }
    });
    
    return Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
  }

  private static getPreferredDeliveryTime(orders: any[]): string {
    // This would need to be implemented based on actual delivery time data
    // For now, return a default value
    return 'afternoon';
  }

  private static calculateEngagementLevel(customer: any): 'high' | 'medium' | 'low' {
    const score = customer.engagement_score || 0;
    
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private static calculateChurnRisk(customer: any, orders: any[]): number {
    let risk = 0;
    
    // Days since last activity
    const daysSinceLastActivity = customer.days_since_last_order || 0;
    if (daysSinceLastActivity > 90) risk += 40;
    else if (daysSinceLastActivity > 60) risk += 25;
    else if (daysSinceLastActivity > 30) risk += 15;
    
    // Order frequency
    if (orders.length > 0) {
      const avgDaysBetweenOrders = daysSinceLastActivity / Math.max(orders.length, 1);
      if (avgDaysBetweenOrders > 60) risk += 30;
      else if (avgDaysBetweenOrders > 30) risk += 20;
    }
    
    // Engagement score
    const engagementScore = customer.engagement_score || 0;
    if (engagementScore < 30) risk += 30;
    else if (engagementScore < 50) risk += 15;
    
    return Math.min(risk, 100);
  }

  private static async getProductsByCategories(categories: string[]): Promise<any[]> {
    if (categories.length === 0) return [];
    
    const result = await databaseService.query(
      `SELECT p.*, pt.name as product_type_name
       FROM products p
       JOIN product_types pt ON p.product_type_id = pt.id
       WHERE pt.name IN (${categories.map(() => '?').join(',')})
       AND p.is_active = true
       ORDER BY p.display_order ASC
       LIMIT 10`,
      categories
    );
    
    return Array.isArray(result) ? result : [];
  }

  private static async getComplementaryProducts(customerId: number): Promise<any[]> {
    // This would analyze purchase patterns to find complementary products
    // For now, return popular products
    const result = await databaseService.query(
      `SELECT p.*, pt.name as product_type_name
       FROM products p
       JOIN product_types pt ON p.product_type_id = pt.id
       WHERE p.is_active = true
       ORDER BY p.display_order ASC
       LIMIT 5`
    );
    
    return Array.isArray(result) ? result : [];
  }

  private static getPriceRange(averageOrderValue: number) {
    if (averageOrderValue >= 300) {
      return { min: 150, max: 500 };
    } else if (averageOrderValue >= 200) {
      return { min: 100, max: 400 };
    } else if (averageOrderValue >= 100) {
      return { min: 50, max: 300 };
    } else {
      return { min: 20, max: 200 };
    }
  }
} 