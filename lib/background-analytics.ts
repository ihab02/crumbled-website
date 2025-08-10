import { databaseService } from '@/lib/services/databaseService';
import { debugLog } from '@/lib/debug-utils';
import { analyticsCache } from '@/lib/analytics-cache';

interface AnalyticsJob {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  data?: any;
  error?: string;
}

class BackgroundAnalyticsProcessor {
  private jobs = new Map<string, AnalyticsJob>();
  private isProcessing = false;

  // Schedule analytics jobs
  async scheduleAnalyticsJob(type: 'daily' | 'weekly' | 'monthly'): Promise<string> {
    const jobId = `analytics_${type}_${Date.now()}`;
    
    const job: AnalyticsJob = {
      id: jobId,
      type,
      status: 'pending',
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);
    
    await debugLog('Analytics job scheduled', { jobId, type });
    
    // Process in background
    this.processJobs();
    
    return jobId;
  }

  // Process pending jobs
  private async processJobs() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      const pendingJobs = Array.from(this.jobs.values())
        .filter(job => job.status === 'pending');

      for (const job of pendingJobs) {
        await this.processJob(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual job
  private async processJob(job: AnalyticsJob) {
    job.status = 'processing';
    
    try {
      await debugLog('Processing analytics job', { jobId: job.id, type: job.type });
      
      // Calculate date range based on job type
      const { startDate, endDate } = this.calculateDateRange(job.type);
      
      // Generate comprehensive analytics data
      const analyticsData = await this.generateComprehensiveAnalytics(startDate, endDate);
      
      job.data = analyticsData;
      job.status = 'completed';
      job.completedAt = new Date();
      
      // Cache the result
      const cacheKey = `background_analytics:${job.type}`;
      analyticsCache.set(cacheKey, analyticsData);
      
      await debugLog('Analytics job completed', { jobId: job.id, type: job.type });
      
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      
      await debugLog('Analytics job failed', { jobId: job.id, error: job.error });
    }
  }

  // Calculate date range for job type
  private calculateDateRange(type: 'daily' | 'weekly' | 'monthly') {
    const now = new Date();
    let startDate: Date;
    
    switch (type) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  }

  // Generate comprehensive analytics (heavy operation)
  private async generateComprehensiveAnalytics(startDate: string, endDate: string) {
    return await databaseService.transaction(async (connection) => {
      // This is a heavy operation that runs in background
      const [comprehensiveData] = await connection.execute(`
        SELECT 
          -- Revenue metrics
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as total_revenue,
          COUNT(CASE WHEN status != 'cancelled' THEN 1 END) as successful_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          
          -- Customer metrics
          COUNT(DISTINCT customer_id) as unique_customers,
          
          -- Product metrics
          COUNT(DISTINCT JSON_EXTRACT(oi.flavor_details, '$[0].id')) as unique_products_sold,
          
          -- Delivery metrics
          AVG(CASE WHEN status = 'delivered' 
            THEN TIMESTAMPDIFF(MINUTE, created_at, updated_at) 
            ELSE NULL END) as avg_delivery_time,
          
          -- Payment metrics
          SUM(CASE WHEN payment_method = 'cod' THEN total ELSE 0 END) as cod_revenue,
          SUM(CASE WHEN payment_method = 'paymob' THEN total ELSE 0 END) as paymob_revenue
          
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE DATE(o.created_at) BETWEEN ? AND ?
      `, [startDate, endDate]);

      return (comprehensiveData as any)[0];
    });
  }

  // Get job status
  getJobStatus(jobId: string): AnalyticsJob | null {
    return this.jobs.get(jobId) || null;
  }

  // Get all jobs
  getAllJobs(): AnalyticsJob[] {
    return Array.from(this.jobs.values());
  }

  // Clean up old completed jobs
  cleanupOldJobs(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = Date.now() - maxAge;
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' && job.completedAt && job.completedAt.getTime() < cutoff) {
        this.jobs.delete(jobId);
      }
    }
  }
}

export const backgroundAnalytics = new BackgroundAnalyticsProcessor();

// Auto-cleanup every hour
setInterval(() => {
  backgroundAnalytics.cleanupOldJobs();
}, 60 * 60 * 1000); 