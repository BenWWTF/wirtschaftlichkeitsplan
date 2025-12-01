'use client'

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { getCohortAnalysis, getHeatMapColor, calculateCohortStats } from '@/lib/actions/cohort-analysis'
import { formatEuro } from '@/lib/utils'

interface CohortAnalysisProps {
  year?: number
  className?: string
}

type MetricType = 'revenue' | 'sessions' | 'margin' | 'occupancy'

/**
 * Cohort Analysis Component
 * Displays heat map of metrics by therapy and month
 */
export function CohortAnalysis({
  year = new Date().getFullYear(),
  className = '',
}: CohortAnalysisProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('revenue')
  const [selectedYear, setSelectedYear] = useState(year)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await getCohortAnalysis(selectedYear, selectedMetric)
        setData(result)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load cohort analysis'
        setError(message)
        console.error('[CohortAnalysis] Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [selectedYear, selectedMetric])

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case 'revenue':
        return 'Umsatz'
      case 'sessions':
        return 'Sitzungen'
      case 'margin':
        return 'Gewinnmarge (%)'
      case 'occupancy':
        return 'Auslastung (%)'
    }
  }

  const formatValue = (value: number, metric: MetricType) => {
    if (value === 0) return '-'
    if (metric === 'revenue') return formatEuro(value)
    if (metric === 'margin' || metric === 'occupancy') return `${value.toFixed(0)}%`
    return Math.round(value).toString()
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="bg-neutral-200 dark:bg-neutral-700 rounded-lg h-12 animate-pulse" />
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
              Kohorten-Analysedaten für das ausgewählte Jahr nicht gefunden.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate global min/max for heat map
  const allValues = (Object.values(data.data)
    .flat() as unknown[])
    .filter((v): v is number => typeof v === 'number' && v > 0)
  const globalMin = allValues.length > 0 ? Math.min(...allValues) : 0
  const globalMax = allValues.length > 0 ? Math.max(...allValues) : 100

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Kohortenanalyse
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Therapie-Performance über {selectedYear}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
            className="px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800"
          >
            <option value="revenue">Umsatz</option>
            <option value="sessions">Sitzungen</option>
            <option value="margin">Gewinnmarge</option>
            <option value="occupancy">Auslastung</option>
          </select>

          <input
            type="number"
            min="2020"
            max={new Date().getFullYear()}
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 w-24"
          />
        </div>
      </div>

      {/* Heat Map Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
              <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">
                Therapietyp
              </th>
              {data.months.map((month: string, idx: number) => (
                <th
                  key={idx}
                  className="text-center px-3 py-3 font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
                >
                  {month}
                </th>
              ))}
              <th className="text-right px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">
                Durchschnitt
              </th>
            </tr>
          </thead>
          <tbody>
            {data.therapies.map((therapy: any) => {
              const therapyValues = data.data[therapy.id] || []
              const stats = calculateCohortStats(therapyValues)
              return (
                <tr
                  key={therapy.id}
                  className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-50">
                    {therapy.name}
                  </td>
                  {therapyValues.map((value: number, idx: number) => (
                    <td
                      key={idx}
                      className={`text-center px-3 py-3 ${getHeatMapColor(
                        value,
                        globalMin,
                        globalMax,
                        selectedMetric
                      )}`}
                    >
                      {formatValue(value, selectedMetric)}
                    </td>
                  ))}
                  <td className="text-right px-4 py-3 font-medium text-neutral-900 dark:text-neutral-50">
                    {formatValue(stats.avg, selectedMetric)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900/40" />
          <span className="text-neutral-600 dark:text-neutral-400">Ausgezeichnet (&gt;75%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30" />
          <span className="text-neutral-600 dark:text-neutral-400">Gut (50-75%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/30" />
          <span className="text-neutral-600 dark:text-neutral-400">Mittel (25-50%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30" />
          <span className="text-neutral-600 dark:text-neutral-400">Schwach (&lt;25%)</span>
        </div>
      </div>
    </div>
  )
}
