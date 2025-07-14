"use client"

import { useEffect, useState } from 'react'
import { useCart } from './cart-provider'

interface PerformanceMetrics {
  cartApiCalls: number
  lastCallTime: Date | null
  averageResponseTime: number
  cacheHits: number
  cacheMisses: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cartApiCalls: 0,
    lastCallTime: null,
    averageResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  })
  const { lastUpdated } = useCart()

  useEffect(() => {
    // Monitor cart API calls
    const originalFetch = window.fetch
    let callCount = 0
    let totalResponseTime = 0

    window.fetch = async (...args) => {
      const url = args[0] as string
      const startTime = performance.now()
      
      if (url.includes('/api/cart')) {
        callCount++
        setMetrics(prev => ({
          ...prev,
          cartApiCalls: callCount,
          lastCallTime: new Date()
        }))
      }

      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        const responseTime = endTime - startTime

        if (url.includes('/api/cart')) {
          totalResponseTime += responseTime
          setMetrics(prev => ({
            ...prev,
            averageResponseTime: totalResponseTime / callCount
          }))
        }

        return response
      } catch (error) {
        throw error
      }
    }

    // Cleanup
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50">
      <div className="mb-2 font-bold">Performance Monitor</div>
      <div>Cart API Calls: {metrics.cartApiCalls}</div>
      <div>Avg Response: {metrics.averageResponseTime.toFixed(2)}ms</div>
      <div>Last Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}</div>
      <div className="mt-2 text-green-400">
        ✅ Enhanced cart provider active
      </div>
    </div>
  )
} 