/**
 * Main Dashboard Component
 * Orchestrates metrics fetching and displays all dashboard sections
 */

'use client'

import { useState, useEffect } from 'react'
import { ViabilityScorer, BreakEvenIndicator } from './header'
import { ContextToggle, VarianceAlerts, KPICards } from './primary-view'
import { TherapyPerformanceMatrix } from './detail-view'
import { getUnifiedMetrics } from '@/lib/metrics/unified-metrics'
import type {
  MetricsScope,
  ComparisonMode,
  UnifiedMetricsResponse
} from '@/lib/metrics/unified-metrics'

interface DashboardProps {
  /**
   * Optional initial scope (defaults to 'month')
   */
  initialScope?: MetricsScope
  /**
   * Optional initial comparison mode (defaults to 'plan')
   */
  initialComparisonMode?: ComparisonMode
}

export function Dashboard({
  initialScope = 'month',
  initialComparisonMode = 'plan'
}: DashboardProps) {
  const [scope, setScope] = useState<MetricsScope>(initialScope)
  const [comparisonMode, setComparisonMode] =
    useState<ComparisonMode>(initialComparisonMode)
  const [metrics, setMetrics] = useState<UnifiedMetricsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch metrics when scope or comparison mode changes
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
          err instanceof Error ? err.message : 'Failed to load metrics'
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [scope, comparisonMode])

  // Error state
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Error Loading Dashboard
        </h3>
        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
      </div>
    )
  }

  // Loading state
  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-40 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
          <div className="h-40 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
        </div>
        <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
        <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Tier 1: Critical Health Indicators */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ViabilityScorer score={metrics.viabilityScore} />
          <BreakEvenIndicator
            netIncome={metrics.netIncome}
            targetBreakEven={Math.abs(metrics.netIncome)}
            status={metrics.breakEvenStatus}
          />
        </div>
      </section>

      {/* Tier 2: Context & Comparison Controls */}
      <section>
        <ContextToggle
          currentScope={scope}
          currentComparisonMode={comparisonMode}
          onScopeChange={setScope}
          onComparisonModeChange={setComparisonMode}
        />
      </section>

      {/* Tier 2: Variance Alerts */}
      {metrics.variances.length > 0 && (
        <section>
          <VarianceAlerts alerts={metrics.variances} />
        </section>
      )}

      {/* Tier 2: Primary KPI Cards */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Key Performance Indicators
          </h2>
        </div>
        <KPICards metrics={metrics} />
      </section>

      {/* Tier 3: Therapy Performance */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Therapy Type Performance
          </h2>
        </div>
        <TherapyPerformanceMatrix therapies={metrics.therapyMetrics} />
      </section>

      {/* Footer: Data Quality & Update Time */}
      <section className="text-center text-xs text-neutral-500 dark:text-neutral-400 py-4 border-t border-neutral-200 dark:border-neutral-700">
        <p>
          Data Quality:{' '}
          <span className="font-semibold capitalize">{metrics.dataQuality}</span> •
          Last Updated: {metrics.lastUpdated.toLocaleTimeString('de-DE')}
        </p>
      </section>
    </div>
  )
}
