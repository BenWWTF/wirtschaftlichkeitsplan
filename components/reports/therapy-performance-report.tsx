'use client'

import { useEffect, useState } from 'react'
import { getAdvancedAnalytics } from '@/lib/actions/analytics'
import type { AdvancedAnalytics } from '@/lib/actions/analytics'
import { formatEuro } from '@/lib/utils'
import { AlertCircle, TrendingUp } from 'lucide-react'

export function TherapyPerformanceReport() {
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
          <div key={i} className="bg-neutral-200 dark:bg-neutral-700 rounded-lg h-20 animate-pulse" />
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
            Create therapy types and monthly plans to generate reports.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
          Therapie Leistungsbericht
        </h2>

        <div className="space-y-4">
          {/* Top Therapy by Revenue */}
          {analytics.topTherapyByRevenue && (
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    🥇 {analytics.topTherapyByRevenue.name}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Top Therapie nach Umsatz
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatEuro(analytics.topTherapyByRevenue.revenue)}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {analytics.topTherapyByRevenue.sessions} Sitzungen
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Top Therapy by Margin */}
          {analytics.topTherapyByMargin && (
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    📊 {analytics.topTherapyByMargin.name}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Top Therapie nach Deckungsbeitrag
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatEuro(analytics.topTherapyByMargin.margin)}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {analytics.topTherapyByMargin.marginPercent.toFixed(1)}% Marge
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Average Session Price */}
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  💶 Durchschnittlicher Sitzungspreis
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Mittelwert aller Therapiearten
                </p>
              </div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatEuro(analytics.averageSessionPrice)}
              </p>
            </div>
          </div>

          {/* Sessions */}
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                📈 Sitzungen
              </h3>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {analytics.occupancyRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  analytics.occupancyRate >= 80
                    ? 'bg-green-500'
                    : analytics.occupancyRate >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(analytics.occupancyRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
              {analytics.occupancyRate >= 80
                ? '✅ Ausgezeichnet - Geplante vs. durchgeführte Sitzungen'
                : analytics.occupancyRate >= 60
                ? '⚠️ Gut - Potenzial zur Steigerung vorhanden'
                : '❌ Niedrig - Überprüfen Sie die Planungen'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
