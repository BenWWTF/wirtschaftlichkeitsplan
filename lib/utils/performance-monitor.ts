import { onCLS, onFCP, onLCP, onINP, Metric } from 'web-vitals'

/**
 * Performance metrics thresholds (in milliseconds)
 * Based on Google's Web Vitals guidelines
 */
export const PERFORMANCE_THRESHOLDS = {
  // Largest Contentful Paint - should be <= 2500ms
  LCP: 2500,
  // Interaction to Next Paint - should be <= 200ms (replaces FID)
  INP: 200,
  // Cumulative Layout Shift - should be <= 0.1
  CLS: 0.1,
  // First Contentful Paint - should be <= 1800ms
  FCP: 1800,
}

/**
 * Core Web Vitals metric data
 */
export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id?: string
  delta?: number
  entries?: any[]
}

/**
 * Performance monitoring state
 */
export interface PerformanceState {
  metrics: Map<string, PerformanceMetric>
  isGood: boolean
  summary: {
    good: number
    needsImprovement: number
    poor: number
  }
}

/**
 * Initialize performance monitoring and collect Core Web Vitals
 * Logs metrics to console in development, sends to analytics in production
 */
export function initializePerformanceMonitoring() {
  if (typeof window === 'undefined') return

  const metrics: Map<string, PerformanceMetric> = new Map()

  /**
   * Handle metric collection
   */
  const handleMetric = (metric: Metric) => {
    const perfMetric: PerformanceMetric = {
      ...metric,
      name: metric.name,
      value: metric.value,
      rating: metric.rating || 'good',
    }

    metrics.set(metric.name, perfMetric)

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}: ${metric.value.toFixed(2)}ms`, {
        rating: metric.rating,
        delta: metric.delta?.toFixed(2),
        id: metric.id,
      })
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      sendMetricToAnalytics(perfMetric)
    }
  }

  // Collect all Core Web Vitals
  onCLS(handleMetric)
  onINP(handleMetric)
  onLCP(handleMetric)
  onFCP(handleMetric)

  // Return utility functions
  return {
    getMetrics: () => Object.fromEntries(metrics),
    getMetric: (name: string) => metrics.get(name),
    isPerformanceGood: () => {
      const entries = Array.from(metrics.values())
      return entries.every((m) => m.rating === 'good')
    },
    getSummary: () => {
      const entries = Array.from(metrics.values())
      return {
        good: entries.filter((m) => m.rating === 'good').length,
        needsImprovement: entries.filter((m) => m.rating === 'needs-improvement').length,
        poor: entries.filter((m) => m.rating === 'poor').length,
        total: entries.length,
      }
    },
  }
}

/**
 * Send metric to analytics service
 * Integrate with your analytics provider (GA, Datadog, etc.)
 */
function sendMetricToAnalytics(metric: PerformanceMetric) {
  // Example: Send to Google Analytics
  if (typeof window !== 'undefined' && 'gtag' in window) {
    ;(window as any).gtag?.event('page_view', {
      value: metric.value,
      event_category: 'Web Vitals',
      event_label: metric.name,
      non_interaction: true,
    })
  }

  // Example: Send to custom analytics endpoint
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
      }),
    }).catch(() => {
      // Silently fail in production
    })
  }
}

/**
 * Get performance recommendations based on current metrics
 */
export function getPerformanceRecommendations(
  metrics: Map<string, PerformanceMetric>
): string[] {
  const recommendations: string[] = []

  // LCP recommendations
  const lcpMetric = metrics.get('LCP')
  if (lcpMetric && lcpMetric.value > PERFORMANCE_THRESHOLDS.LCP) {
    recommendations.push(
      'LCP is high. Consider optimizing images, reducing server response time, or enabling lazy loading.'
    )
  }

  // INP recommendations
  const inpMetric = metrics.get('INP')
  if (inpMetric && inpMetric.value > PERFORMANCE_THRESHOLDS.INP) {
    recommendations.push(
      'INP is high. Consider reducing JavaScript execution time or breaking up long tasks.'
    )
  }

  // CLS recommendations
  const clsMetric = metrics.get('CLS')
  if (clsMetric && clsMetric.value > PERFORMANCE_THRESHOLDS.CLS) {
    recommendations.push(
      'CLS is high. Ensure all images/ads have dimensions to prevent layout shifts.'
    )
  }

  // FCP recommendations
  const fcpMetric = metrics.get('FCP')
  if (fcpMetric && fcpMetric.value > PERFORMANCE_THRESHOLDS.FCP) {
    recommendations.push(
      'FCP is slow. Reduce CSS blocking time or consider critical CSS inlining.'
    )
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Performance looks good! Continue monitoring to maintain these metrics.'
    )
  }

  return recommendations
}

/**
 * Hook for React components to use performance monitoring
 */
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = React.useState<Map<string, PerformanceMetric>>(
    new Map()
  )

  React.useEffect(() => {
    const monitor = initializePerformanceMonitoring()

    // Only set up interval if monitoring was initialized
    if (!monitor) return

    // Update metrics periodically
    const interval = setInterval(() => {
      const metricsData = monitor.getMetrics()
      setMetrics(new Map(Object.entries(metricsData || {})))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return {
    metrics,
    summary: Array.from(metrics.values()).reduce(
      (acc, m) => ({
        ...acc,
        [m.name]: { value: m.value, rating: m.rating },
      }),
      {}
    ),
    recommendations: getPerformanceRecommendations(metrics),
  }
}

// Note: Import React at the top of any file using usePerformanceMonitoring
import React from 'react'
