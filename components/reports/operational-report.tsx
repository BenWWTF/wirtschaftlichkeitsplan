'use client'

import { useEffect, useState } from 'react'
import { getAdvancedAnalytics } from '@/lib/actions/analytics'
import type { AdvancedAnalytics } from '@/lib/actions/analytics'
import { AlertCircle } from 'lucide-react'

export function OperationalReport() {
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
            Create monthly plans to generate operational reports.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
          Operativer Bericht
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sessions */}
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
              Sitzungen
            </h3>
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold text-neutral-900 dark:text-white">
                  {analytics.occupancyRate.toFixed(1)}
                </p>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-1">%</p>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Geplante vs. durchgeführte Sitzungen
              </p>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    analytics.occupancyRate >= 80
                      ? 'bg-green-500'
                      : analytics.occupancyRate >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(analytics.occupancyRate, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Session Performance */}
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
              Sitzungsleistung
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Durchgeführte Sitzungen:
                </span>
                <span className="text-lg font-bold text-neutral-900 dark:text-white">
                  {Math.round(analytics.occupancyRate)}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Auf Basis der Auslastungsquote
              </p>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
              Trend-Analyse
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Umsatz Trend:
                </span>
                <span className={`font-semibold ${
                  analytics.revenueTrend === null
                    ? 'text-neutral-600 dark:text-neutral-400'
                    : analytics.revenueTrend > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {analytics.revenueTrend === null ? '—' : `${analytics.revenueTrend > 0 ? '+' : ''}${analytics.revenueTrend.toFixed(1)}%`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Kosten Trend:
                </span>
                <span className={`font-semibold ${
                  analytics.costTrend === null
                    ? 'text-neutral-600 dark:text-neutral-400'
                    : analytics.costTrend < 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {analytics.costTrend === null ? '—' : `${analytics.costTrend > 0 ? '+' : ''}${analytics.costTrend.toFixed(1)}%`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Gewinn Trend:
                </span>
                <span className={`font-semibold ${
                  analytics.profitTrend === null
                    ? 'text-neutral-600 dark:text-neutral-400'
                    : analytics.profitTrend > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {analytics.profitTrend === null ? '—' : `${analytics.profitTrend > 0 ? '+' : ''}${analytics.profitTrend.toFixed(1)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
              Leistungsübersicht
            </h3>
            <div className="space-y-2">
              {analytics.occupancyRate >= 80 ? (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✅ Ausgezeichnete Auslastung
                </p>
              ) : analytics.occupancyRate >= 60 ? (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                  ⚠️ Gute Auslastung mit Raum für Verbesserungen
                </p>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  ❌ Niedrige Auslastung - Überprüfung erforderlich
                </p>
              )}
              {analytics.profitMarginPercent >= 30 ? (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✅ Gesunde Gewinnmarge
                </p>
              ) : analytics.profitMarginPercent >= 10 ? (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                  ⚠️ Moderate Gewinnmarge
                </p>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  ❌ Kritische Gewinnmarge
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
