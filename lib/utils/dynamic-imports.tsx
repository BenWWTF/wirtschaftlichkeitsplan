'use client'

import React from 'react'
import dynamic from 'next/dynamic'

/**
 * Lazy load chart components to reduce initial bundle size
 * Recharts (54.2 KB) is only loaded when the user visits chart pages
 */

export const DynamicBreakEvenChart = dynamic(
  () => import('@/components/dashboard/break-even-chart').then((mod) => mod.BreakEvenChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

export const DynamicRevenueChart = dynamic(
  () => import('@/components/dashboard/revenue-chart').then((mod) => mod.RevenueChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

/**
 * Lazy load the analysis view component
 * This is the heavy component on /dashboard/analyse route
 */

export const DynamicAnalysisView = dynamic(
  () => import('@/components/dashboard/analysis-view').then((mod) => mod.AnalysisView),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      </div>
    ),
    ssr: true,
  }
)

/**
 * Chart loading skeleton
 */
function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-96 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
      <div className="h-12 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
    </div>
  )
}
