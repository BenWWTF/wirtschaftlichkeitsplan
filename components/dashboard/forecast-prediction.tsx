'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, TrendingUp } from 'lucide-react'
import { getAdvancedAnalytics } from '@/lib/actions/analytics'
import { forecast } from '@/lib/utils/forecasting'
import { formatEuro } from '@/lib/utils'

interface ForecastPredictionProps {
  className?: string
  months?: number
}

export function ForecastPrediction({
  className = '',
  months = 6,
}: ForecastPredictionProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forecastMonths, setForecastMonths] = useState(months)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const analytics = await getAdvancedAnalytics()
        if (analytics) {
          setData(analytics)
        } else {
          setError('No analytics data available')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load forecast data'
        setError(message)
        console.error('[ForecastPrediction] Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return <div className={`space-y-4 ${className}`}><div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg h-64 animate-pulse" /></div>
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
              Prognosedaten konnten nicht geladen werden.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const historicalRevenue = [3000, 3200, 3500, 3400, 3800, 4000]
  const historicalCosts = [1200, 1250, 1300, 1320, 1400, 1450]

  const revenueForcast = forecast(historicalRevenue, forecastMonths)
  const costForecast = forecast(historicalCosts, forecastMonths)

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Vorhersagen
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Prognose für die nächsten {forecastMonths} Monate
          </p>
        </div>
        <select
          value={forecastMonths}
          onChange={(e) => setForecastMonths(parseInt(e.target.value))}
          className="px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800"
        >
          <option value="3">3 Monate</option>
          <option value="6">6 Monate</option>
          <option value="12">12 Monate</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
            Umsatztrend
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              {revenueForcast.slope > 0 ? '+' : ''}
              {formatEuro(revenueForcast.slope)}/M
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            R² = {revenueForcast.r2.toFixed(2)}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
            Prognose +{forecastMonths}M
          </h3>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {formatEuro(revenueForcast.values[revenueForcast.values.length - 1])}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            +{(((revenueForcast.values[revenueForcast.values.length - 1] - historicalRevenue[historicalRevenue.length - 1]) / historicalRevenue[historicalRevenue.length - 1]) * 100).toFixed(1)}%
          </p>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
            Konfidenzintervall
          </h3>
          <div className="space-y-1 text-sm">
            <p className="text-neutral-900 dark:text-neutral-50">
              Oben: {formatEuro(revenueForcast.confidenceInterval.upper[revenueForcast.confidenceInterval.upper.length - 1])}
            </p>
            <p className="text-neutral-900 dark:text-neutral-50">
              Unten: {formatEuro(revenueForcast.confidenceInterval.lower[revenueForcast.confidenceInterval.lower.length - 1])}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50">
        <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4">
          Detaillierte Prognose
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                  Monat
                </th>
                <th className="text-right py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                  Prognose
                </th>
                <th className="text-right py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                  Oben (95%)
                </th>
                <th className="text-right py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                  Unten (95%)
                </th>
              </tr>
            </thead>
            <tbody>
              {revenueForcast.values.map((value, idx) => (
                <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-700">
                  <td className="py-2 px-3 text-neutral-900 dark:text-neutral-50">
                    Monat +{idx + 1}
                  </td>
                  <td className="text-right py-2 px-3 text-neutral-900 dark:text-neutral-50 font-medium">
                    {formatEuro(value)}
                  </td>
                  <td className="text-right py-2 px-3 text-green-600 dark:text-green-400">
                    {formatEuro(revenueForcast.confidenceInterval.upper[idx])}
                  </td>
                  <td className="text-right py-2 px-3 text-red-600 dark:text-red-400">
                    {formatEuro(revenueForcast.confidenceInterval.lower[idx])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
