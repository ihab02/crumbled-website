/**
 * Server-side debug utilities
 * These functions use direct database access and should only be used in server-side code
 */

import pool from '@/lib/db';

// Cache for debug mode to avoid frequent database queries
let debugModeCache: boolean | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Get debug mode status from database
 */
export async function getDebugMode(): Promise<boolean> {
  const now = Date.now();
  
  // Return cached value if still valid
  if (debugModeCache !== null && (now - cacheTimestamp) < CACHE_DURATION) {
    return debugModeCache;
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT debug_mode FROM cart_settings LIMIT 1');
    const settings = rows[0] as any;
    
    debugModeCache = settings?.debug_mode === 1 || settings?.debug_mode === true;
    cacheTimestamp = now;
    
    return debugModeCache;
  } catch (error) {
    console.error('Error fetching debug mode:', error);
    // Return false as fallback
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Clear debug mode cache (call this when settings are updated)
 */
export function clearDebugModeCache(): void {
  debugModeCache = null;
  cacheTimestamp = 0;
}

/**
 * Debug logger that only logs when debug mode is enabled
 */
export async function debugLog(message: string, ...args: any[]): Promise<void> {
  const isDebugMode = await getDebugMode();
  if (isDebugMode) {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Debug logger for synchronous operations (uses cached value)
 */
export function debugLogSync(message: string, ...args: any[]): void {
  if (debugModeCache === true) {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Debug logger that accepts a callback to avoid expensive operations when debug is off
 */
export async function debugLogCallback(
  message: string, 
  callback: () => any[] | Promise<any[]>
): Promise<void> {
  const isDebugMode = await getDebugMode();
  if (isDebugMode) {
    const args = await callback();
    console.debug(`[DEBUG] ${message}`, ...args);
  }
} 