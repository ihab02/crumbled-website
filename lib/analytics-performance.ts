import { debugLog } from '@/lib/debug-utils';

interface QueryPerformance {
  queryName: string;
  executionTime: number;
  resultSize: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

class AnalyticsPerformanceMonitor {
  private queryLogs: QueryPerformance[] = [];
  private readonly MAX_LOGS = 1000;

  // Monitor query performance
  async monitorQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;
    let result: T;

    try {
      result = await queryFn();
      const executionTime = Date.now() - startTime;
      
      this.logQuery({
        queryName,
        executionTime,
        resultSize: this.calculateResultSize(result),
        timestamp: new Date(),
        success: true
      });

      // Log slow queries
      if (executionTime > 1000) { // > 1 second
        await debugLog('Slow analytics query detected', {
          queryName,
          executionTime,
          resultSize: this.calculateResultSize(result)
        });
      }

      return result;

    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      
      this.logQuery({
        queryName,
        executionTime: Date.now() - startTime,
        resultSize: 0,
        timestamp: new Date(),
        success: false,
        error
      });

      throw err;
    }
  }

  // Log query performance
  private logQuery(performance: QueryPerformance) {
    this.queryLogs.push(performance);
    
    // Keep only recent logs
    if (this.queryLogs.length > this.MAX_LOGS) {
      this.queryLogs = this.queryLogs.slice(-this.MAX_LOGS);
    }
  }

  // Calculate result size (rough estimate)
  private calculateResultSize(result: any): number {
    if (Array.isArray(result)) {
      return result.length;
    }
    if (typeof result === 'object' && result !== null) {
      return Object.keys(result).length;
    }
    return 1;
  }

  // Get performance statistics
  getPerformanceStats() {
    const successfulQueries = this.queryLogs.filter(q => q.success);
    const failedQueries = this.queryLogs.filter(q => !q.success);

    if (successfulQueries.length === 0) {
      return {
        totalQueries: this.queryLogs.length,
        successRate: 0,
        averageExecutionTime: 0,
        slowestQuery: null,
        mostFrequentQuery: null
      };
    }

    const executionTimes = successfulQueries.map(q => q.executionTime);
    const averageExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;

    // Find slowest query
    const slowestQuery = successfulQueries.reduce((slowest, current) => 
      current.executionTime > slowest.executionTime ? current : slowest
    );

    // Find most frequent query
    const queryFrequency = this.queryLogs.reduce((acc, query) => {
      acc[query.queryName] = (acc[query.queryName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostFrequentQuery = Object.entries(queryFrequency)
      .reduce((most, current) => current[1] > most[1] ? current : most);

    return {
      totalQueries: this.queryLogs.length,
      successRate: (successfulQueries.length / this.queryLogs.length) * 100,
      averageExecutionTime: Math.round(averageExecutionTime),
      slowestQuery: {
        name: slowestQuery.queryName,
        executionTime: slowestQuery.executionTime,
        timestamp: slowestQuery.timestamp
      },
      mostFrequentQuery: {
        name: mostFrequentQuery[0],
        count: mostFrequentQuery[1]
      },
      failedQueries: failedQueries.length
    };
  }

  // Get recent performance data
  getRecentPerformance(minutes: number = 60) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.queryLogs.filter(log => log.timestamp.getTime() > cutoff);
  }

  // Clear old logs
  clearOldLogs(hours: number = 24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    this.queryLogs = this.queryLogs.filter(log => log.timestamp.getTime() > cutoff);
  }
}

export const analyticsPerformance = new AnalyticsPerformanceMonitor();

// Auto-cleanup old logs every hour
setInterval(() => {
  analyticsPerformance.clearOldLogs();
}, 60 * 60 * 1000); 