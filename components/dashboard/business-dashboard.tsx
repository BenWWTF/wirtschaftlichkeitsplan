'use client'

import { useState, useMemo } from 'react'
import type { MonthlyMetrics, TherapyMetrics, DashboardSummary } from '@/lib/actions/dashboard'
import { formatEuro } from '@/lib/utils'
import { RevenueChart } from './revenue-chart'
import { TherapyComparison } from './therapy-comparison'
import { TrendingUp, TrendingDown, Euro, BarChart3 } from 'lucide-react'

interface BusinessDashboardProps {
  monthlyData: MonthlyMetrics[]
  therapyMetrics: TherapyMetrics[]
  summary: DashboardSummary
}

export function BusinessDashboard({
  monthlyData,
  therapyMetrics,
  summary
}: BusinessDashboardProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'composed'>('composed')
  const [therapyChartType, setTherapyChartType] = useState<'bar' | 'radar'>('bar')

  // Calculate trends
  const trends = useMemo(() => {
    if (monthlyData.length < 2) return null

    const currentMonth = monthlyData[monthlyData.length - 1]
    const previousMonth = monthlyData[monthlyData.length - 2]

    const revenueChange =
      ((currentMonth.actual_revenue - previousMonth.actual_revenue) /
        previousMonth.actual_revenue) *
      100
    const profitChange =
      ((currentMonth.profitability - previousMonth.profitability) /
        Math.abs(previousMonth.profitability)) *
      100

    return {
      revenueChange,
      profitChange
    }
  }, [monthlyData])

  // Sort therapies by revenue
  const topTherapies = useMemo(
    () => [...therapyMetrics].sort((a, b) => b.total_revenue - a.total_revenue),
    [therapyMetrics]
  )

  const statusColor =
    summary.break_even_status === 'surplus'
      ? 'text-green-600 dark:text-green-400'
      : summary.break_even_status === 'breakeven'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400'

  const statusBg =
    summary.break_even_status === 'surplus'
      ? 'bg-green-50 dark:bg-green-900/20'
      : summary.break_even_status === 'breakeven'
        ? 'bg-amber-50 dark:bg-amber-900/20'
        : 'bg-red-50 dark:bg-red-900/20'

  const statusLabel =
    summary.break_even_status === 'surplus'
      ? 'Gewinn'
      : summary.break_even_status === 'breakeven'
        ? 'Break-Even'
        : 'Verlust'

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Gesamtumsatz
            </p>
            <Euro className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">
            {formatEuro(summary.total_revenue)}
          </p>
          {trends && (
            <p
              className={`text-sm mt-2 flex items-center gap-1 ${
                trends.revenueChange >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {trends.revenueChange >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(trends.revenueChange).toFixed(1)}% vs. letzter Monat
            </p>
          )}
        </div>

        {/* Net Income */}
        <div className={`${statusBg} rounded-lg border ${
          summary.break_even_status === 'surplus'
            ? 'border-green-200 dark:border-green-800'
            : summary.break_even_status === 'breakeven'
              ? 'border-amber-200 dark:border-amber-800'
              : 'border-red-200 dark:border-red-800'
        } p-6`}>
          <div className="flex items-center justify-between mb-4">
            <p
              className={`text-sm ${
                summary.break_even_status === 'surplus'
                  ? 'text-green-600 dark:text-green-400'
                  : summary.break_even_status === 'breakeven'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {statusLabel}
            </p>
            <BarChart3 className={`h-5 w-5 ${statusColor}`} />
          </div>
          <p className={`text-3xl font-bold ${statusColor}`}>
            {formatEuro(summary.net_income)}
          </p>
          <p
            className={`text-sm mt-2 ${
              summary.break_even_status === 'surplus'
                ? 'text-green-700 dark:text-green-300'
                : summary.break_even_status === 'breakeven'
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-red-700 dark:text-red-300'
            }`}
          >
            {summary.profitability_rate.toFixed(1)}% Gewinnmarge
          </p>
        </div>

        {/* Total Expenses with SumUp breakdown */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Gesamtkosten
            </p>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
            {formatEuro(summary.total_costs_with_sumup)}
          </p>
          <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
            <div className="flex justify-between">
              <span>Fixkosten:</span>
              <span className="font-medium">{formatEuro(summary.total_expenses)}</span>
            </div>
            <div className="flex justify-between text-orange-600 dark:text-orange-400">
              <span>SumUp-Gebühren:</span>
              <span className="font-medium">{formatEuro(summary.sumup_costs)}</span>
            </div>
          </div>
        </div>

        {/* Average Session Price */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Ø Sitzungspreis
            </p>
            <Euro className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">
            {formatEuro(summary.average_session_price)}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            basierend auf {summary.total_sessions} Sitzungen
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Umsatz & Gewinn im Zeitverlauf
          </h3>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            className="px-3 py-1 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
          >
            <option value="composed">Kombiniert</option>
            <option value="line">Linie</option>
            <option value="bar">Balken</option>
          </select>
        </div>
        <RevenueChart data={monthlyData} chartType={chartType} />
      </div>

      {/* Therapy Comparison */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Therapiearten-Vergleich
          </h3>
          <select
            value={therapyChartType}
            onChange={(e) => setTherapyChartType(e.target.value as any)}
            className="px-3 py-1 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
          >
            <option value="bar">Balken</option>
            <option value="radar">Radar</option>
          </select>
        </div>
        <TherapyComparison
          therapies={therapyMetrics}
          chartType={therapyChartType}
        />
      </div>

      {/* Top Therapies */}
      {topTherapies.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Top Therapiearten nach Umsatz
          </h3>
          <div className="space-y-3">
            {topTherapies.slice(0, 5).map((therapy) => (
              <div
                key={therapy.therapy_id}
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-lg"
              >
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {therapy.therapy_name}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {therapy.total_actual_sessions} Sitzungen
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {formatEuro(therapy.total_revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
