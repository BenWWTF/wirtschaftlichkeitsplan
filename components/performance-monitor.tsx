'use client'

import { useEffect } from 'react'
import { initializePerformanceMonitoring, getPerformanceRecommendations } from '@/lib/utils/performance-monitor'

/**
 * Performance Monitor Component
 * Initializes Core Web Vitals tracking when mounted
 * Runs in browser only
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance monitoring
    const monitor = initializePerformanceMonitoring()

    // Only log if monitoring was initialized
    if (!monitor) return

    // Log summary after 5 seconds (gives time for metrics to be collected)
    const timeout = setTimeout(() => {
      const summary = monitor.getSummary()
      const isGood = monitor.isPerformanceGood()

      if (process.env.NODE_ENV === 'development') {
        console.group('[Performance Monitor]')
        console.log('Metrics collected:', summary)
        console.log('Overall performance:', isGood ? '✅ Good' : '⚠️ Needs improvement')
        console.groupEnd()
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [])

  // This component doesn't render anything, it just initializes monitoring
  return null
}
