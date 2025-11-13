'use client'

import { useEffect, useState } from 'react'
import { getAdvancedAnalytics } from '@/lib/actions/analytics'
import type { AdvancedAnalytics } from '@/lib/actions/analytics'
import { formatEuro } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

export function FinancialSummaryReport() {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getAdvancedAnalytics()
        setAnalytics(data)
      } catch (err) {
        console.error('Failed to load analytics:', err)
        setError('Failed to load report data')
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="bg-neutral-200 dark:bg-neutral-700 rounded-lg h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
            {error || 'No data available'}
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
            Create monthly plans and expenses to generate financial reports.
          </p>
        </div>
      </div>
    )
  }

  // Calculate totals
  const profitMarginStatus = analytics.profitMarginPercent >= 30
    ? { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', label: '✅ Gesund' }
    : analytics.profitMarginPercent >= 10
    ? { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: '⚠️ Moderat' }
    : { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', label: '❌ Kritisch' }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
          Finanzielle Zusammenfassung
        </h2>

        {/* Key Financial Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Revenue per Session */}
          <div className={`${profitMarginStatus.bg} rounded-lg p-4 border border-gray-200 dark:border-gray-700`}>
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Umsatz pro Sitzung
            </h3>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {formatEuro(analytics.revenuePerSession)}
            </p>
            {analytics.revenueTrend !== null && (
              <p className={`text-sm mt-2 font-medium ${analytics.revenueTrend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {analytics.revenueTrend > 0 ? '↑' : '↓'} {Math.abs(analytics.revenueTrend).toFixed(1)}% vs. Vormonat
              </p>
            )}
          </div>

          {/* Cost per Session */}
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Kosten pro Sitzung
            </h3>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {formatEuro(analytics.costPerSession)}
            </p>
            {analytics.costTrend !== null && (
              <p className={`text-sm mt-2 font-medium ${analytics.costTrend < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {analytics.costTrend < 0 ? '↓' : '↑'} {Math.abs(analytics.costTrend).toFixed(1)}% vs. Vormonat
              </p>
            )}
          </div>

          {/* Total Variable Costs */}
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Variable Gesamtkosten
            </h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              -{formatEuro(analytics.totalVariableCosts)}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
              {analytics.costStructure.variableCostsPercent.toFixed(1)}% der Gesamtkosten
            </p>
          </div>

          {/* Profit Margin */}
          <div className={`${profitMarginStatus.bg} rounded-lg p-4 border border-gray-200 dark:border-gray-700`}>
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Gewinnmarge
            </h3>
            <p className={`text-3xl font-bold ${profitMarginStatus.color}`}>
              {analytics.profitMarginPercent.toFixed(1)}%
            </p>
            <p className={`text-xs mt-2 font-medium ${profitMarginStatus.color}`}>
              {profitMarginStatus.label}
            </p>
          </div>
        </div>

        {/* Cost Structure Breakdown */}
        <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
            Kostenaufschlüsselung
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-neutral-600 dark:text-neutral-400">
                  💰 Variable Kosten
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {analytics.costStructure.variableCostsPercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${analytics.costStructure.variableCostsPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-neutral-600 dark:text-neutral-400">
                  🏢 Fixkosten
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {analytics.costStructure.fixedCostsPercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{ width: `${analytics.costStructure.fixedCostsPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
