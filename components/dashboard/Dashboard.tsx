/**
 * Main Dashboard Component
 * Orchestrates metrics fetching and displays all dashboard sections
 */

'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { DataViewToggle, KPICards, MonthComparison, AnnualGoalProgress } from './primary-view'
import { TherapyPerformanceMatrix } from './detail-view'
import { AnimatedSection } from '@/components/ui/animated-section'
import { getUnifiedMetrics } from '@/lib/metrics/unified-metrics'
import { getHistoricalSnapshots } from '@/lib/metrics/historical-metrics'
import { getPracticeSettings } from '@/lib/actions/settings'
import type {
  MetricsScope,
  ComparisonMode,
  UnifiedMetricsResponse
} from '@/lib/metrics/unified-metrics'
import type { MonthlySnapshot } from '@/lib/metrics/historical-metrics'

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear())

  // Map data view mode to comparison mode
  const comparisonMode: ComparisonMode = dataViewMode === 'prognose' ? 'none' : 'plan'
  const [metrics, setMetrics] = useState<UnifiedMetricsResponse | null>(null)
  const [previousMetrics, setPreviousMetrics] = useState<UnifiedMetricsResponse | null>(null)
  const [historicalData, setHistoricalData] = useState<MonthlySnapshot[]>([])
  const [annualGoal, setAnnualGoal] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Navigation functions
  const handleSelectMonth = (month: number) => {
    setSelectedDate(new Date(viewYear, month - 1, 1))
    setIsCalendarOpen(false)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
    setViewYear(new Date().getFullYear())
    setIsCalendarOpen(false)
  }

  // Fetch metrics when scope, comparison mode, or date changes
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch current month metrics
        const result = await getUnifiedMetrics({
          scope,
          compareMode: comparisonMode,
          dataViewMode,
          date: selectedDate
        })
        setMetrics(result)

        // Fetch previous month metrics for comparison
        const prevDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
        try {
          const prevResult = await getUnifiedMetrics({
            scope,
            compareMode: 'none',
            dataViewMode,
            date: prevDate
          })
          setPreviousMetrics(prevResult)
        } catch {
          // Previous month data may not exist; that is acceptable
          setPreviousMetrics(null)
        }

        // Fetch historical snapshots for sparklines (non-blocking)
        try {
          const snapshots = await getHistoricalSnapshots(6)
          setHistoricalData(snapshots)
        } catch {
          // Historical data is optional; don't block on failure
          setHistoricalData([])
        }

        // Fetch annual goal from practice settings (non-blocking)
        try {
          const settings = await getPracticeSettings()
          setAnnualGoal(settings?.annual_revenue_goal ?? null)
        } catch {
          setAnnualGoal(null)
        }
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

  // Loading state - glass-morphism skeleton screens
  if (isLoading || !metrics) {
    return (
      <div className="space-y-8">
        {/* Period Header Skeleton */}
        <div className="bg-accent-500/5 backdrop-blur-xl border border-accent-200/20 dark:border-accent-400/5 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-3">
              <div className="h-4 w-20 bg-accent-200/40 dark:bg-accent-800/30 rounded animate-pulse" />
              <div className="h-8 w-48 bg-accent-200/50 dark:bg-accent-800/40 rounded animate-pulse" />
              <div className="h-3 w-36 bg-neutral-200/50 dark:bg-neutral-700/30 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-accent-200/30 dark:bg-accent-800/20 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Data View Toggle Skeleton */}
        <div className="h-10 w-64 bg-neutral-200/40 dark:bg-neutral-800/40 rounded-full animate-pulse mx-auto" />

        {/* Revenue Flow Skeleton */}
        <div className="bg-white/60 backdrop-blur-lg border border-white/20 dark:bg-neutral-800/50 dark:border-white/5 rounded-lg p-6 space-y-3">
          <div className="h-4 w-32 bg-neutral-200/60 dark:bg-neutral-700/40 rounded animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-neutral-200/50 dark:bg-neutral-700/30 rounded animate-pulse" />
                <div className="h-4 w-28 bg-neutral-200/50 dark:bg-neutral-700/30 rounded animate-pulse" />
              </div>
              <div className="h-5 w-24 bg-neutral-200/60 dark:bg-neutral-700/40 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* KPI Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white/60 backdrop-blur-lg border border-white/20 dark:bg-neutral-800/50 dark:border-white/5 rounded-lg p-6 border-l-4 border-l-neutral-200 dark:border-l-neutral-700"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-24 bg-neutral-200/60 dark:bg-neutral-700/40 rounded animate-pulse" />
                <div className="h-5 w-5 bg-neutral-200/40 dark:bg-neutral-700/30 rounded animate-pulse" />
              </div>
              <div className="h-9 w-32 bg-neutral-200/60 dark:bg-neutral-700/40 rounded animate-pulse mt-2" />
              <div className="h-3 w-28 bg-neutral-200/40 dark:bg-neutral-700/20 rounded animate-pulse mt-3" />
            </div>
          ))}
        </div>

        {/* Metric Explanations Skeleton */}
        <div className="space-y-4">
          <div className="h-5 w-56 bg-neutral-200/50 dark:bg-neutral-700/30 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white/60 backdrop-blur-lg border border-white/20 dark:bg-neutral-800/50 dark:border-white/5 rounded-lg p-6 border-l-4 border-l-accent-200 dark:border-l-accent-800"
              >
                <div className="h-4 w-32 bg-neutral-200/50 dark:bg-neutral-700/30 rounded animate-pulse mb-3" />
                <div className="h-8 w-20 bg-neutral-200/60 dark:bg-neutral-700/40 rounded animate-pulse mb-3" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-neutral-200/40 dark:bg-neutral-700/20 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-neutral-200/40 dark:bg-neutral-700/20 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
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

  const selectedMonth = selectedDate.getMonth() + 1
  const selectedYear = selectedDate.getFullYear()

  return (
    <div className="space-y-8">
      {/* Period Header with Calendar Navigation */}
      <section className="bg-accent-500/10 backdrop-blur-xl border border-accent-200/30 dark:bg-accent-500/5 dark:border-accent-400/10 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Calendar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="min-h-[44px] w-full sm:w-auto px-4 py-2 bg-white dark:bg-neutral-800 border border-accent-300 dark:border-accent-700 rounded-lg hover:bg-accent-50 dark:hover:bg-neutral-700 transition-colors font-medium text-neutral-900 dark:text-white flex items-center justify-center sm:justify-start gap-2"
              >
                <span>{MONTHS[selectedMonth - 1]} {selectedYear}</span>
                <span className={`transform transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Calendar Popover */}
              {isCalendarOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white/90 backdrop-blur-xl dark:bg-neutral-800/90 dark:backdrop-blur-xl border border-accent-200 dark:border-accent-700 rounded-lg shadow-lg p-4 w-72">
                  {/* Year Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setViewYear(viewYear - 1)}
                      className="p-2 hover:bg-accent-100 dark:hover:bg-accent-900/30 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {viewYear}
                    </span>
                    <button
                      onClick={() => setViewYear(viewYear + 1)}
                      className="p-2 hover:bg-accent-100 dark:hover:bg-accent-900/30 rounded-lg transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Month Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1
                      const isSelected = selectedYear === viewYear && selectedMonth === month

                      return (
                        <button
                          key={month}
                          onClick={() => handleSelectMonth(month)}
                          className={`py-2 px-2 rounded text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-accent-600 text-white'
                              : 'bg-accent-50 dark:bg-accent-950/30 text-neutral-900 dark:text-white hover:bg-accent-100 dark:hover:bg-accent-900/50'
                          }`}
                        >
                          {MONTHS[month - 1].slice(0, 3)}
                        </button>
                      )
                    })}
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setIsCalendarOpen(false)}
                    className="absolute top-2 right-2 p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Period Display */}
            <div>
              <p className="text-xs sm:text-sm font-semibold text-accent-600 dark:text-accent-400 uppercase tracking-wide">
                Zeitraum
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-1 sm:mt-2">
                {formatPeriodDisplay()}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {metrics.period.start.toLocaleDateString('de-DE')} – {metrics.period.end.toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>

          {/* Current Month Button */}
          <button
            onClick={goToToday}
            className="min-h-[44px] w-full sm:w-auto px-3 py-2 text-sm font-medium text-accent-600 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-900/50 rounded-lg transition-colors"
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

      {/* Tier 2: Primary KPI Cards */}
      <section>
        <KPICards metrics={metrics} dataViewMode={dataViewMode} historicalData={historicalData} />
      </section>

      {/* Tier 2.3: Annual Goal Progress */}
      {annualGoal && annualGoal > 0 && (
        <section>
          <AnnualGoalProgress
            annualGoal={annualGoal}
            currentYearNetRevenue={
              historicalData
                .filter((s) => s.month.startsWith(String(new Date().getFullYear())))
                .reduce((sum, s) => sum + s.totalNetRevenue, 0)
            }
            monthsElapsed={new Date().getMonth() + 1}
            historicalData={historicalData}
          />
        </section>
      )}

      {/* Tier 2.4: Month-over-Month Comparison */}
      <section>
        <MonthComparison
          currentMetrics={{
            totalRevenue: metrics.totalRevenue,
            totalNetRevenue: metrics.totalNetRevenue,
            totalSessions: metrics.totalSessions,
            totalExpenses: metrics.totalExpenses,
            netIncome: metrics.netIncome,
            averageSessionPrice: metrics.averageSessionPrice,
          }}
          previousMetrics={
            previousMetrics
              ? {
                  totalRevenue: previousMetrics.totalRevenue,
                  totalNetRevenue: previousMetrics.totalNetRevenue,
                  totalSessions: previousMetrics.totalSessions,
                  totalExpenses: previousMetrics.totalExpenses,
                  netIncome: previousMetrics.netIncome,
                  averageSessionPrice: previousMetrics.averageSessionPrice,
                }
              : null
          }
          currentLabel={selectedDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
          previousLabel={new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        />
      </section>

      {/* Tier 3: Therapy Performance */}
      <AnimatedSection animation="fade-up">
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Leistung nach Therapieart
            </h2>
          </div>
          <TherapyPerformanceMatrix therapies={metrics.therapyMetrics} dataViewMode={dataViewMode} />
        </section>
      </AnimatedSection>

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
