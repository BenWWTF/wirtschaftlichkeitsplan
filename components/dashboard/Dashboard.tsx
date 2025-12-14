/**
 * Main Dashboard Component
 * Orchestrates metrics fetching and displays all dashboard sections
 */

'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, TrendingUp, DollarSign, Target, AlertCircle } from 'lucide-react'
import { DataViewToggle, KPICards } from './primary-view'
import { TherapyPerformanceMatrix } from './detail-view'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MetricExplanation } from './metric-explanation'
import { getUnifiedMetrics } from '@/lib/metrics/unified-metrics'
import type {
  MetricsScope,
  ComparisonMode,
  UnifiedMetricsResponse
} from '@/lib/metrics/unified-metrics'

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

  const selectedMonth = selectedDate.getMonth() + 1
  const selectedYear = selectedDate.getFullYear()

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <section className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <Breadcrumb
          items={[
            { label: 'Wirtschaftlichkeitsplan', href: '/dashboard' }
          ]}
          className="text-xs sm:text-sm"
        />
      </section>

      {/* Period Header with Calendar Navigation */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Calendar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="px-4 py-2 bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-neutral-700 transition-colors font-medium text-neutral-900 dark:text-white flex items-center gap-2"
              >
                <span>{MONTHS[selectedMonth - 1]} {selectedYear}</span>
                <span className={`transform transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Calendar Popover */}
              {isCalendarOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-700 rounded-lg shadow-lg p-4 w-72">
                  {/* Year Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setViewYear(viewYear - 1)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {viewYear}
                    </span>
                    <button
                      onClick={() => setViewYear(viewYear + 1)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
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
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-50 dark:bg-blue-950/30 text-neutral-900 dark:text-white hover:bg-blue-100 dark:hover:bg-blue-900/50'
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

      {/* Tier 2: Primary KPI Cards */}
      <section>
        <KPICards metrics={metrics} dataViewMode={dataViewMode} />
      </section>

      {/* Tier 2.5: Metric Explanations - "Why This Matters" */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
            Was bedeuten diese Zahlen?
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Verstehen Sie, wie Ihre Kennzahlen zusammenhängen und welche Maßnahmen diese beeinflussen.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricExplanation
            icon={<DollarSign className="h-5 w-5" />}
            title="Monatlicher Umsatz"
            value={metrics.totalRevenue.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
            unit="€"
            description="Summe aller Einnahmen aus Therapiesitzungen in diesem Zeitraum. Berechnet als: Anzahl der Sitzungen × Preis pro Sitzung für jede Therapieart."
            benchmark="Steigen Sie ab, wenn Sie mehr Patienten behandeln oder die Preise erhöhen."
            actionLabel="Preise in der Planung anpassen"
            actionHref="/dashboard/planung"
          />
          <MetricExplanation
            icon={<Target className="h-5 w-5" />}
            title="Kosten gesamt"
            value={(metrics.totalExpenses + metrics.totalPaymentFees).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
            unit="€"
            description="Die Summe aller Ihrer fixen und variablen Kosten für diesen Zeitraum, einschließlich Therapieraum, Material und Verwaltung."
            benchmark="Versuchen Sie, Kosten unter 55% des Umsatzes zu halten."
            actionLabel="Kosten überprüfen"
            actionHref="/dashboard/ausgaben"
          />
          <MetricExplanation
            icon={<TrendingUp className="h-5 w-5" />}
            title="Gewinn (Netto)"
            value={metrics.netIncome.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
            unit="€"
            description="Das Geld, das nach Abzug aller Kosten (einschließlich SumUp-Gebühren) von Ihren Einnahmen übrig bleibt. Dies ist der tatsächliche Nettogewinn Ihrer Praxis."
            benchmark="Ein positiver Gewinn bedeutet, dass Ihre Praxis profitabel ist."
            actionLabel="Prognose erstellen"
            actionHref="/dashboard/analyse"
          />
        </div>
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
