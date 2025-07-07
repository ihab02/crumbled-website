import { databaseService } from './databaseService';
import { BehavioralScoringService, CustomerSegment } from './behavioralScoringService';

export interface CommunicationPreferences {
  email: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'never';
    categories: string[];
  };
  sms: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly' | 'never';
    categories: string[];
  };
  push: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly' | 'never';
    categories: string[];
  };
}

export interface ContentTemplate {
  email: {
    subject: string;
    body: string;
    cta: string;
  };
  sms: {
    message: string;
    cta?: string;
  };
}

export interface CampaignRule {
  id: string | number;
  type: string;
  priority?: string;
  segment: CustomerSegment[];
  conditions: {
    lastOrderDays?: number;
    averageOrderValue?: { min: number; max: number };
    favoriteCategories?: string[];
    churnRisk?: { min: number; max: number };
  };
  actions: ContentTemplate & {
    discountCode?: string;
    productRecommendations?: boolean;
  };
}

export class CommunicationOrchestrator {
  
  /**
   * Get optimal communication channel for a customer and message type
   */
  static getOptimalChannel(customer: any, messageType: string): string {
    const prefs = customer.communication_preferences || {};
    
    switch (messageType) {
      case 'order_confirmation':
        return prefs.sms?.enabled ? 'sms' : 'email';
      case 'delivery_update':
        return prefs.sms?.enabled ? 'sms' : 'email';
      case 'promotion':
        return prefs.email?.enabled ? 'email' : 'sms';
      case 'abandoned_cart':
        return prefs.sms?.enabled ? 'sms' : 'email';
      case 'review_request':
        return prefs.email?.enabled ? 'email' : 'sms';
      default:
        return 'email';
    }
  }

  /**
   * Get optimal send time for a customer and channel
   */
  static getOptimalSendTime(customer: any, channel: string): Date {
    const behavior = customer.behavior || {};
    const timezone = customer.timezone || 'Africa/Cairo';
    
    // Analyze when customer is most active
    const activeHours = this.analyzeCustomerActivity(customer);
    
    // Consider delivery preferences
    const preferredDeliveryTime = behavior.preferredDeliveryTime || 'afternoon';
    
    // Calculate optimal send time
    let optimalHour = 10; // Default to 10 AM
    
    if (preferredDeliveryTime === 'morning') optimalHour = 8;
    if (preferredDeliveryTime === 'afternoon') optimalHour = 14;
    if (preferredDeliveryTime === 'evening') optimalHour = 18;
    
    return this.scheduleInTimezone(optimalHour, timezone);
  }

  /**
   * Generate personalized content for a customer
   */
  static generatePersonalizedContent(
    customer: any, 
    template: ContentTemplate, 
    channel: string
  ): string {
    const behavior = customer.behavior || {};
    
    // Replace placeholders with personalized data
    let content = template[channel];
    
    content = content.replace('{customer_name}', customer.first_name || 'Customer');
    content = content.replace('{favorite_category}', behavior.favoriteCategories?.[0] || 'cookies');
    content = content.replace('{average_order}', (behavior.averageOrderValue || 0).toFixed(0));
    content = content.replace('{last_order_date}', this.formatLastOrderDate(customer));
    content = content.replace('{lifetime_value}', (behavior.lifetimeValue || 0).toFixed(0));
    content = content.replace('{total_orders}', (behavior.totalOrders || 0).toString());
    
    // Add personalized recommendations for email
    if (channel === 'email' && customer.recommendations) {
      content += this.generateRecommendationsHTML(customer.recommendations);
    }
    
    return content;
  }

  /**
   * Send multi-channel campaign to a customer
   */
  static async sendMultiChannelCampaign(
    customer: any, 
    campaign: CampaignRule
  ): Promise<void> {
    try {
      const channels = this.determineChannels(customer, campaign);
      
      for (const channel of channels) {
        const content = this.generatePersonalizedContent(customer, campaign.actions, channel);
        const sendTime = this.getOptimalSendTime(customer, channel);
        
        await this.scheduleMessage({
          customerId: customer.id,
          channel,
          content,
          sendTime,
          campaignId: campaign.id
        });
      }
    } catch (error) {
      console.error('Error sending multi-channel campaign:', error);
      throw error;
    }
  }

  /**
   * Execute behavioral campaign based on customer segments
   */
  static async executeBehavioralCampaign(rule: CampaignRule): Promise<void> {
    try {
      const eligibleCustomers = await this.getCustomersBySegment(rule.segment);
      
      for (const customer of eligibleCustomers) {
        const behavior = await BehavioralScoringService.calculateCustomerBehavior(customer.id);
        
        if (this.matchesConditions(behavior, rule.conditions)) {
          // Add behavior data to customer object
          customer.behavior = behavior;
          
          // Get personalized recommendations if needed
          if (rule.actions.productRecommendations) {
            customer.recommendations = await BehavioralScoringService.getPersonalizedRecommendations(customer.id);
          }
          
          await this.sendMultiChannelCampaign(customer, rule);
        }
      }
    } catch (error) {
      console.error('Error executing behavioral campaign:', error);
      throw error;
    }
  }

  /**
   * Handle order confirmation communication
   */
  static async handleOrderConfirmation(order: any): Promise<void> {
    try {
      const customer = await this.getCustomer(order.customer_id);
      const channel = this.getOptimalChannel(customer, 'order_confirmation');
      
      const template: ContentTemplate = {
        email: {
          subject: 'Order Confirmed - {customer_name}',
          body: `Hi {customer_name}, your order #{order_id} has been confirmed! We'll notify you when it's ready for delivery.`,
          cta: 'Track Order'
        },
        sms: {
          message: 'Hi {customer_name}, your order #{order_id} is confirmed! We\'ll notify you when ready for delivery.',
          cta: 'Track Order'
        }
      };
      
      await this.sendMessage({
        customer,
        channel,
        template,
        data: { order }
      });
    } catch (error) {
      console.error('Error handling order confirmation:', error);
    }
  }

  /**
   * Handle abandoned cart recovery
   */
  static async handleAbandonedCart(cart: any): Promise<void> {
    try {
      const customer = await this.getCustomer(cart.customer_id);
      const behavior = await BehavioralScoringService.calculateCustomerBehavior(customer.id);
      
      // Only send if customer is likely to respond
      if (behavior.churnRisk < 60) {
        const channel = this.getOptimalChannel(customer, 'abandoned_cart');
        
        const recommendations = await BehavioralScoringService.getPersonalizedRecommendations(customer.id);
        
        const template: ContentTemplate = {
          email: {
            subject: 'Complete Your Order - {customer_name}',
            body: `Hi {customer_name}, don't forget about your cart! We've saved your items for you.`,
            cta: 'Complete Order'
          },
          sms: {
            message: 'Hi {customer_name}, complete your order! Your cart is waiting for you.',
            cta: 'Complete Order'
          }
        };
        
        await this.sendMessage({
          customer,
          channel,
          template,
          data: { cart, recommendations }
        });
      }
    } catch (error) {
      console.error('Error handling abandoned cart:', error);
    }
  }

  /**
   * Track communication performance
   */
  static async trackCommunicationPerformance(
    messageId: string, 
    customerId: number, 
    channel: string
  ): Promise<void> {
    try {
      // Track opens, clicks, conversions
      const metrics = await this.getMessageMetrics(messageId);
      
      // Update customer preferences based on engagement
      if (metrics.opened && channel === 'email') {
        await this.updateCustomerPreferences(customerId, {
          email: { engagement_score: metrics.engagement_score }
        });
      }
      
      // A/B test different channels and timings
      await this.runABTest(customerId, channel, metrics);
    } catch (error) {
      console.error('Error tracking communication performance:', error);
    }
  }

  // Private helper methods
  private static determineChannels(customer: any, campaign: CampaignRule): string[] {
    const channels = [];
    const prefs = customer.communication_preferences || {};
    
    // Primary channel based on campaign type and preferences
    const primaryChannel = this.getOptimalChannel(customer, campaign.type);
    channels.push(primaryChannel);
    
    // Secondary channel for important campaigns
    if (campaign.priority === 'high' && channels[0] !== 'sms') {
      channels.push('sms');
    }
    
    return channels;
  }

  private static async scheduleMessage(messageData: any): Promise<void> {
    // This would integrate with your email/SMS service
    // For now, just log the message
    console.log('Scheduling message:', messageData);
    
    // Store in database for tracking
    await databaseService.query(
      `INSERT INTO communication_messages (customer_id, channel, content, scheduled_at, status)
       VALUES (?, ?, ?, ?, 'scheduled')`,
      [messageData.customerId, messageData.channel, messageData.content, messageData.sendTime]
    );
  }

  private static async getCustomersBySegment(segments: CustomerSegment[]): Promise<any[]> {
    const allCustomers = [];
    
    for (const segment of segments) {
      const customers = await BehavioralScoringService.getCustomersBySegment(segment);
      allCustomers.push(...customers);
    }
    
    return allCustomers;
  }

  private static matchesConditions(behavior: any, conditions: any): boolean {
    if (conditions.lastOrderDays && behavior.daysSinceLastActivity < conditions.lastOrderDays) {
      return false;
    }
    
    if (conditions.averageOrderValue) {
      const { min, max } = conditions.averageOrderValue;
      if (behavior.averageOrderValue < min || behavior.averageOrderValue > max) {
        return false;
      }
    }
    
    if (conditions.churnRisk) {
      const { min, max } = conditions.churnRisk;
      if (behavior.churnRisk < min || behavior.churnRisk > max) {
        return false;
      }
    }
    
    return true;
  }

  private static async getCustomer(customerId: number): Promise<any> {
    const result = await databaseService.query(
      'SELECT * FROM customers WHERE id = ?',
      [customerId]
    );
    
    return Array.isArray(result) ? result[0] : result;
  }

  private static async sendMessage(messageData: any): Promise<void> {
    // This would integrate with your email/SMS service
    console.log('Sending message:', messageData);
  }

  private static analyzeCustomerActivity(customer: any): any {
    // This would analyze customer activity patterns
    // For now, return default values
    return { preferredHour: 14, preferredDay: 'weekday' };
  }

  private static scheduleInTimezone(hour: number, timezone: string): Date {
    // This would handle timezone conversion
    // For now, return current time + hour offset
    const now = new Date();
    now.setHours(hour, 0, 0, 0);
    return now;
  }

  private static formatLastOrderDate(customer: any): string {
    if (!customer.last_order_date) return 'never';
    
    const date = new Date(customer.last_order_date);
    return date.toLocaleDateString();
  }

  private static generateRecommendationsHTML(recommendations: any[]): string {
    if (!recommendations || recommendations.length === 0) return '';
    
    let html = '<div class="recommendations"><h3>Recommended for you:</h3><ul>';
    
    recommendations.forEach(rec => {
      html += `<li>${rec.name} - ${rec.base_price} EGP</li>`;
    });
    
    html += '</ul></div>';
    return html;
  }

  private static async getMessageMetrics(messageId: string): Promise<any> {
    // This would fetch metrics from your email/SMS service
    return { opened: true, clicked: false, engagement_score: 50 };
  }

  private static async updateCustomerPreferences(customerId: number, updates: any): Promise<void> {
    // This would update customer communication preferences
    console.log('Updating customer preferences:', customerId, updates);
  }

  private static async runABTest(customerId: number, channel: string, metrics: any): Promise<void> {
    // This would run A/B tests for optimization
    console.log('Running A/B test:', customerId, channel, metrics);
  }
} 