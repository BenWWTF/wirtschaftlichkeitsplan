'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { getAdvancedAnalytics } from '@/lib/actions/analytics'
import { forecast, exponentialSmoothing, calculateBreakevenMonths } from '@/lib/utils/forecasting'
import { formatEuro } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ForecastPredictionProps {
  className?: string
  months?: number
}

/**
 * Forecast & Predictions Component
 * Predicts future metrics using linear regression and exponential smoothing
 */
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
        const message =
          err instanceof Error ? err.message : 'Failed to load forecast data'
        setError(message)
        console.error('[ForecastPrediction] Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg h-96 animate-pulse" />
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
              Prognosedaten konnten nicht geladen werden.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Simple mock historical data for demonstration
  const historicalRevenue = [
    3000, 3200, 3500, 3400, 3800, 4000,
  ]
  const historicalCosts = [
    1200, 1250, 1300, 1320, 1400, 1450,
  ]

  // Generate forecasts
  const revenueForcast = forecast(historicalRevenue, forecastMonths)
  const costForecast = forecast(historicalCosts, forecastMonths)

  // Create chart data
  const monthLabels = ['Mon 1', 'Mon 2', 'Mon 3', 'Mon 4', 'Mon 5', 'Mon 6']
  const chartData: Array<{
    month: string
    actualRevenue: number | null
    actualCosts: number | null
    forecastedRevenue: number | null
    forecastedCosts: number | null
  }> = monthLabels.map((label, idx) => ({
    month: label,
    actualRevenue: historicalRevenue[idx],
    actualCosts: historicalCosts[idx],
    forecastedRevenue:
      idx >= historicalRevenue.length
        ? revenueForcast.values[idx - historicalRevenue.length]
        : null,
    forecastedCosts:
      idx >= historicalCosts.length
        ? costForecast.values[idx - historicalCosts.length]
        : null,
  }))

  // Add forecast months
  for (let i = 0; i < forecastMonths; i++) {
    chartData.push({
      month: `M+${i + 1}`,
      actualRevenue: null,
      actualCosts: null,
      forecastedRevenue: revenueForcast.values[i],
      forecastedCosts: costForecast.values[i],
    })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Vorhersagen & Prognosen
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Lineare Regression für die nächsten {forecastMonths} Monate
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

      {/* Forecast Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
            Umsatztrend
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              {(revenueForcast.slope > 0 ? '+' : '')}
              {formatEuro(revenueForcast.slope)}/Monat
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            R² = {revenueForcast.r2.toFixed(2)}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
            Prognose Umsatz (+{forecastMonths}M)
          </h3>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {formatEuro(
              revenueForcast.values[revenueForcast.values.length - 1]
            )}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            +{(
              ((revenueForcast.values[revenueForcast.values.length - 1] -
                historicalRevenue[historicalRevenue.length - 1]) /
                historicalRevenue[historicalRevenue.length - 1]) *
              100
            ).toFixed(1)}
            %
          </p>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
            Konfidenzintervall (95%)
          </h3>
          <div className="space-y-1 text-sm">
            <p className="text-neutral-900 dark:text-neutral-50">
              Oben: {formatEuro(
                revenueForcast.confidenceInterval.upper[
                  revenueForcast.confidenceInterval.upper.length - 1
                ]
              )}
            </p>
            <p className="text-neutral-900 dark:text-neutral-50">
              Unten: {formatEuro(
                revenueForcast.confidenceInterval.lower[
                  revenueForcast.confidenceInterval.lower.length - 1
                ]
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50">
        <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4">
          Umsatz- und Kostenvorhersage
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => (typeof value === 'number' && value ? formatEuro(value) : 'N/A')} />
            <Legend />
            <Line
              type="monotone"
              dataKey="actualRevenue"
              stroke="#10b981"
              name="Tatsächlicher Umsatz"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="forecastedRevenue"
              stroke="#3b82f6"
              name="Prognostizierter Umsatz"
              strokeDasharray="5 5"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="actualCosts"
              stroke="#ef4444"
              name="Tatsächliche Kosten"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="forecastedCosts"
              stroke="#f97316"
              name="Prognostizierte Kosten"
              strokeDasharray="5 5"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Vorhersage-Genauigkeit
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            R² = {revenueForcast.r2.toFixed(3)} (Guter Fit mit dem Trend)
          </p>
        </div>
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900">
          <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
            Erwartete Marge
          </h4>
          <p className="text-sm text-green-800 dark:text-green-200">
            {(
              (
                (revenueForcast.values[revenueForcast.values.length - 1] -
                  costForecast.values[costForecast.values.length - 1]) /
                revenueForcast.values[revenueForcast.values.length - 1]
              ) *
              100
            ).toFixed(1)}
            % Gewinn
          </p>
        </div>
      </div>
    </div>
  )
}
