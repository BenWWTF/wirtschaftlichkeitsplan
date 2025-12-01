'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { getYoYComparison, type YoYComparisonData } from '@/lib/actions/yoy-comparison'
import { formatEuro } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface YoYComparisonProps {
  year?: number
  month?: number
  className?: string
}

/**
 * Year-over-Year Comparison Component
 * Compare metrics and therapies with previous year same period
 */
export function YoYComparison({
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1,
  className = '',
}: YoYComparisonProps) {
  const [data, setData] = useState<YoYComparisonData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(year)
  const [selectedMonth, setSelectedMonth] = useState(month)

  // Load YoY data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await getYoYComparison(selectedYear, selectedMonth)
        setData(result)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load YoY comparison'
        setError(message)
        console.error('[YoYComparison] Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [selectedYear, selectedMonth])

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => {
      if (prev === 1) {
        setSelectedYear(y => y - 1)
        return 12
      }
      return prev - 1
    })
  }

  const handleNextMonth = () => {
    setSelectedMonth(prev => {
      if (prev === 12) {
        setSelectedYear(y => y + 1)
        return 1
      }
      return prev + 1
    })
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
      case 'neutral':
        return <Minus className="w-4 h-4 text-neutral-400" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      case 'neutral':
        return 'text-neutral-500'
    }
  }

  const formatValue = (value: number, unit?: string) => {
    if (unit === '€') return formatEuro(value)
    return `${value.toFixed(1)}${unit || ''}`
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="bg-neutral-200 dark:bg-neutral-700 rounded-lg h-20 animate-pulse" />
          ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={`p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
              {error || 'Keine Daten verfügbar'}
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
              Vergleichsdaten für den Vorjahresmonat nicht gefunden.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Jahresvergleich
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {data.period}
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
          >
            ← Vorheriger Monat
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
          >
            Nächster Monat →
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.metrics.map(metric => (
          <div
            key={metric.metric}
            className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50"
          >
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
              {metric.metric}
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                  {new Date().getFullYear()}
                </p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {formatValue(metric.currentYear, metric.unit)}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                  {new Date().getFullYear() - 1}
                </p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {formatValue(metric.previousYear, metric.unit)}
                </p>
              </div>
            </div>

            {/* Change Indicator */}
            <div className="flex items-center gap-2 p-2 rounded-md bg-neutral-50 dark:bg-neutral-900">
              {getTrendIcon(metric.trend)}
              <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                {metric.changePercent > 0 ? '+' : ''}
                {metric.changePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* YTD Comparison */}
      <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          <h3 className="font-medium text-neutral-900 dark:text-neutral-50">
            Jahr bis Datum (YTD)
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
              {selectedYear}
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              {formatEuro(data.ytdComparison.currentYearToDate)}
            </p>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-neutral-400" />
          </div>

          <div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
              {selectedYear - 1}
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              {formatEuro(data.ytdComparison.previousYearToDate)}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-md bg-neutral-50 dark:bg-neutral-900 flex items-center gap-2">
          <TrendingUp
            className={`w-5 h-5 ${
              data.ytdComparison.changePercent > 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          />
          <span
            className={`font-medium ${
              data.ytdComparison.changePercent > 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {data.ytdComparison.changePercent > 0 ? '+' : ''}
            {data.ytdComparison.changePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Therapy Comparison */}
      {data.therapies.length > 0 && (
        <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-50 mb-4">
            Therapietypen-Vergleich
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                    Therapietyp
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                    Umsatz {selectedYear}
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                    Umsatz {selectedYear - 1}
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                    Änderung
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                    Sitzungen {selectedYear}
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                    Sitzungen {selectedYear - 1}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.therapies.map(therapy => (
                  <tr
                    key={therapy.therapyName}
                    className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-neutral-900 dark:text-neutral-50">
                      {therapy.therapyName}
                    </td>
                    <td className="text-right py-3 px-3 text-neutral-900 dark:text-neutral-50">
                      {formatEuro(therapy.currentYearRevenue)}
                    </td>
                    <td className="text-right py-3 px-3 text-neutral-900 dark:text-neutral-50">
                      {formatEuro(therapy.previousYearRevenue)}
                    </td>
                    <td className="text-right py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          therapy.revenueChangePercent > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {therapy.revenueChangePercent > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {therapy.revenueChangePercent > 0 ? '+' : ''}
                        {therapy.revenueChangePercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-3 text-neutral-900 dark:text-neutral-50">
                      {therapy.currentYearSessions}
                    </td>
                    <td className="text-right py-3 px-3 text-neutral-900 dark:text-neutral-50">
                      {therapy.previousYearSessions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
