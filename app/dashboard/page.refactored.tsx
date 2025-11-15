/**
 * Refactored Dashboard Page
 * Integrates new unified metrics engine and restructured components
 *
 * This is the new dashboard implementation using the calculation layer
 * and unified metrics engine. Can be deployed alongside existing dashboard.
 */

'use client'

import { useState, useEffect } from 'react'
import { ViabilityScorer, BreakEvenIndicator } from '@/components/dashboard/header'
import { ContextToggle } from '@/components/dashboard/primary-view/context-toggle'
import { VarianceAlerts } from '@/components/dashboard/primary-view/variance-alerts'
import { KPICards } from '@/components/dashboard/primary-view/kpi-cards'
import { TherapyPerformanceMatrix } from '@/components/dashboard/detail-view/therapy-performance-matrix'
import { getUnifiedMetrics } from '@/lib/metrics/unified-metrics'
import type {
  MetricsScope,
  ComparisonMode,
  UnifiedMetricsResponse
} from '@/lib/metrics/unified-metrics'

export default function RefactoredDashboard() {
  const [scope, setScope] = useState<MetricsScope>('month')
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('plan')
  const [metrics, setMetrics] = useState<UnifiedMetricsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch metrics whenever scope or comparison mode changes
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getUnifiedMetrics({
          scope,
          compareMode: comparisonMode,
          date: new Date()
        })
        setMetrics(result)
      } catch (err) {
        console.error('Error fetching metrics:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load dashboard metrics'
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [scope, comparisonMode])

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || !metrics) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4">
            <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-40 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              <div className="h-40 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            </div>
            <div className="h-60 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header Section */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Financial Dashboard
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {metrics.period.start.toLocaleDateString('de-DE')} —{' '}
            {metrics.period.end.toLocaleDateString('de-DE')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tier 1: Critical Health Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ViabilityScorer score={metrics.viabilityScore} />
          <BreakEvenIndicator
            netIncome={metrics.netIncome}
            targetBreakEven={Math.abs(metrics.netIncome)}
            status={metrics.breakEvenStatus}
          />
        </div>

        {/* Tier 2: Context & Filters */}
        <div className="mb-8">
          <ContextToggle
            currentScope={scope}
            currentComparisonMode={comparisonMode}
            onScopeChange={setScope}
            onComparisonModeChange={setComparisonMode}
          />
        </div>

        {/* Tier 2: Variance Alerts */}
        {metrics.variances.length > 0 && (
          <div className="mb-8">
            <VarianceAlerts alerts={metrics.variances} />
          </div>
        )}

        {/* Tier 2: Primary KPI Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            Key Performance Indicators
          </h2>
          <KPICards metrics={metrics} />
        </div>

        {/* Tier 3: Therapy Performance */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            Therapy Type Performance
          </h2>
          <TherapyPerformanceMatrix therapies={metrics.therapyMetrics} />
        </div>

        {/* Data Quality Indicator */}
        <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center py-4 border-t border-neutral-200 dark:border-neutral-700">
          <p>
            Data Quality: <strong>{metrics.dataQuality}</strong> • Last Updated:{' '}
            {metrics.lastUpdated.toLocaleTimeString('de-DE')}
          </p>
        </div>
      </div>
    </div>
  )
}
