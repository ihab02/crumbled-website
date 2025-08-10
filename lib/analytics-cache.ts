import { databaseService } from '@/lib/services/databaseService';
import { debugLog } from '@/lib/debug-utils';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class AnalyticsCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100; // Maximum cache entries

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    await debugLog('Analytics cache hit', { key });
    return entry.data;
  }

  set(key: string, data: any): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    };

    this.cache.set(key, entry);
    debugLog('Analytics cache set', { key, cacheSize: this.cache.size });
  }

  invalidate(pattern?: string): void {
    if (pattern) {
      // Invalidate keys matching pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
    
    debugLog('Analytics cache invalidated', { pattern: pattern || 'all' });
  }

  // Generate cache key based on parameters
  generateKey(range: string, adminId: string, customStartDate?: string, customEndDate?: string): string {
    if (range === 'custom' && customStartDate && customEndDate) {
      return `analytics:${range}:${customStartDate}:${customEndDate}:${adminId}`;
    }
    return `analytics:${range}:${adminId}`;
  }
}

export const analyticsCache = new AnalyticsCache();

// Cache invalidation triggers
export async function invalidateAnalyticsCache() {
  analyticsCache.invalidate();
  await debugLog('Analytics cache invalidated due to data change');
}

// Call this function when orders are created/updated
export async function invalidateOrderAnalytics() {
  analyticsCache.invalidate('analytics');
  await debugLog('Order analytics cache invalidated');
} 