/**
 * Main Dashboard Component
 * Orchestrates metrics fetching and displays all dashboard sections
 */

'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DataViewToggle, VarianceAlerts, KPICards } from './primary-view'
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
  const [dataViewMode, setDataViewMode] = useState<'prognose' | 'resultate'>('prognose')
  // Initialize to the first day of the current month
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  // Map data view mode to comparison mode
  const comparisonMode: ComparisonMode = dataViewMode === 'prognose' ? 'none' : 'plan'
  const [metrics, setMetrics] = useState<UnifiedMetricsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Navigation functions
  const goToPreviousMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // Fetch metrics when scope, comparison mode, or date changes
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getUnifiedMetrics({
          scope,
          compareMode: comparisonMode,
          dataViewMode,
          date: selectedDate
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
  }, [scope, comparisonMode, dataViewMode, selectedDate])

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

  // Format period display based on scope
  const formatPeriodDisplay = () => {
    const start = metrics.period.start
    const end = metrics.period.end

    if (scope === 'month') {
      // Show "January 2025" or "Januar 2025"
      return start.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    } else if (scope === 'quarter') {
      const quarter = Math.ceil((start.getMonth() + 1) / 3)
      return `Q${quarter} ${start.getFullYear()}`
    } else if (scope === 'year') {
      return start.getFullYear().toString()
    } else {
      // allTime
      return `${start.getFullYear()} – ${end.getFullYear()}`
    }
  }

  return (
    <div className="space-y-8">
      {/* Period Header with Navigation */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Previous Month Button */}
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </button>

            {/* Period Display */}
            <div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Zeitraum
              </p>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mt-2">
                {formatPeriodDisplay()}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {metrics.period.start.toLocaleDateString('de-DE')} – {metrics.period.end.toLocaleDateString('de-DE')}
              </p>
            </div>

            {/* Next Month Button */}
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </button>
          </div>

          {/* Current Month Button */}
          <button
            onClick={goToToday}
            className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
          >
            Aktueller Monat
          </button>
        </div>
      </section>

      {/* Tier 2: Data View Toggle */}
      <section>
        <DataViewToggle
          currentMode={dataViewMode}
          onModeChange={setDataViewMode}
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
            Leistungskennzahlen
          </h2>
        </div>
        <KPICards metrics={metrics} dataViewMode={dataViewMode} />
      </section>

      {/* Tier 3: Therapy Performance */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Leistung nach Therapieart
          </h2>
        </div>
        <TherapyPerformanceMatrix therapies={metrics.therapyMetrics} dataViewMode={dataViewMode} />
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
