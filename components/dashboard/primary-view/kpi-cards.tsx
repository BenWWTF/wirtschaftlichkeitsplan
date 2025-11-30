/**
 * KPI Cards Component
 * Displays primary metrics in a grid layout with trend indicators and sparklines
 */

'use client'

import { Euro, TrendingUp, Users, BarChart3 } from 'lucide-react'
import { Sparkline } from '@/components/ui/sparkline'
import { TrendBadge } from '@/components/ui/trend-badge'
import type { UnifiedMetricsResponse } from '@/lib/metrics/unified-metrics'

interface KPICardsProps {
  metrics: UnifiedMetricsResponse
  dataViewMode?: 'prognose' | 'resultate'
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

function getStatusColor(value: number, threshold: number = 0) {
  if (value > threshold) return 'text-green-600 dark:text-green-400'
  if (value === threshold) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function calculatePercentageChange(current: number, previous: number): { percentage: number; trend: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    return {
      percentage: current > 0 ? 100 : 0,
      trend: current > 0 ? 'up' : 'neutral'
    }
  }
  const percentage = ((current - previous) / Math.abs(previous)) * 100
  const trend = percentage > 0.5 ? 'up' : percentage < -0.5 ? 'down' : 'neutral'
  return { percentage: Math.abs(Math.round(percentage * 10) / 10), trend }
}

function getSeverityForTrend(trend: 'up' | 'down' | 'neutral', isPositiveIndicator: boolean = true): 'positive' | 'negative' | 'neutral' | 'warning' {
  if (isPositiveIndicator) {
    // For metrics where up is good (revenue, income, sessions)
    return trend === 'up' ? 'positive' : trend === 'down' ? 'negative' : 'neutral'
  } else {
    // For metrics where down is good (expenses)
    return trend === 'down' ? 'positive' : trend === 'up' ? 'negative' : 'neutral'
  }
}

function getDataTypeBadge(mode?: 'prognose' | 'resultate') {
  if (!mode) return null
  if (mode === 'prognose') {
    return (
      <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-xs font-semibold rounded">
        📋 Prognose
      </span>
    )
  }
  return (
    <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200 text-xs font-semibold rounded">
      ✅ Resultate
    </span>
  )
}

export function KPICards({ metrics, dataViewMode }: KPICardsProps) {
  // Calculate month-over-month changes
  const revenueChange = metrics.previousPeriod
    ? calculatePercentageChange(metrics.totalGrossRevenue, metrics.previousPeriod.totalGrossRevenue)
    : { percentage: 0, trend: 'neutral' as const }

  const expensesChange = metrics.previousPeriod
    ? calculatePercentageChange(metrics.totalExpenses + metrics.sumupCosts, metrics.previousPeriod.totalExpenses + metrics.previousPeriod.sumupCosts)
    : { percentage: 0, trend: 'neutral' as const }

  const incomeChange = metrics.previousPeriod
    ? calculatePercentageChange(
        metrics.totalGrossRevenue - metrics.totalExpenses - metrics.sumupCosts,
        metrics.previousPeriod.totalGrossRevenue - metrics.previousPeriod.totalExpenses - metrics.previousPeriod.sumupCosts
      )
    : { percentage: 0, trend: 'neutral' as const }

  const netIncomeChange = metrics.previousPeriod
    ? calculatePercentageChange(metrics.netIncome, metrics.previousPeriod.netIncome)
    : { percentage: 0, trend: 'neutral' as const }

  const avgPriceChange = metrics.previousPeriod
    ? calculatePercentageChange(metrics.averageSessionPrice, metrics.previousPeriod.averageSessionPrice)
    : { percentage: 0, trend: 'neutral' as const }

  const sessionsChange = metrics.previousPeriod
    ? calculatePercentageChange(metrics.totalSessions, metrics.previousPeriod.totalSessions)
    : { percentage: 0, trend: 'neutral' as const }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Revenue */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Gesamtumsatz
          </h3>
          <Euro className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          {getDataTypeBadge(dataViewMode)}
          <TrendBadge
            trend={revenueChange.trend}
            percentage={revenueChange.percentage}
            size="sm"
            severity={getSeverityForTrend(revenueChange.trend, true)}
          />
        </div>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {formatEuro(metrics.totalGrossRevenue)}
        </p>
        {/* Sparkline */}
        <div className="mt-3 h-8">
          <Sparkline
            data={[80, 85, 78, 90, 88, 92, 95]}
            color="blue"
            height={32}
            filled
            showDots={false}
          />
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {metrics.totalSessions} Sitzungen abgeschlossen
        </p>
      </div>

      {/* Total Expenses with SumUp Breakdown */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:border-orange-300 dark:hover:border-orange-600 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Ausgaben
          </h3>
          <TrendingUp className="h-5 w-5 text-orange-500" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          {getDataTypeBadge(dataViewMode)}
          <TrendBadge
            trend={expensesChange.trend}
            percentage={expensesChange.percentage}
            size="sm"
            severity={getSeverityForTrend(expensesChange.trend, false)}
          />
        </div>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
          {formatEuro(metrics.totalExpenses + metrics.sumupCosts)}
        </p>
        {/* Sparkline */}
        <div className="mb-3 h-6">
          <Sparkline
            data={[60, 62, 58, 65, 68, 70, 72]}
            color="amber"
            height={24}
            filled
            showDots={false}
          />
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
            <span>Fixkosten:</span>
            <span className="font-medium">{formatEuro(metrics.totalExpenses)}</span>
          </div>
          {metrics.sumupCosts > 0 && (
            <div className="flex justify-between text-orange-600 dark:text-orange-400 pt-1 border-t border-neutral-200 dark:border-neutral-700">
              <span>SumUp-Gebühren:</span>
              <span className="font-medium">{formatEuro(metrics.sumupCosts)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Gross Income (Gross Revenue - All Expenses) */}
      <div
        className={`rounded-lg border p-6 transition-colors hover:shadow-md ${
          (metrics.totalGrossRevenue - metrics.totalExpenses - metrics.sumupCosts) >= 0
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700'
            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Bruttoeinkommen
          </h3>
          <BarChart3
            className={`h-5 w-5 ${getStatusColor(metrics.totalGrossRevenue - metrics.totalExpenses - metrics.sumupCosts)}`}
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          {getDataTypeBadge(dataViewMode)}
          <TrendBadge
            trend={incomeChange.trend}
            percentage={incomeChange.percentage}
            size="sm"
            severity={getSeverityForTrend(incomeChange.trend, true)}
          />
        </div>
        <p
          className={`text-3xl font-bold ${getStatusColor(metrics.totalGrossRevenue - metrics.totalExpenses - metrics.sumupCosts)}`}
        >
          {formatEuro(metrics.totalGrossRevenue - metrics.totalExpenses - metrics.sumupCosts)}
        </p>
        {/* Sparkline */}
        <div className="mt-3 h-8">
          <Sparkline
            data={[65, 72, 68, 78, 82, 85, 88]}
            color="green"
            height={32}
            filled
            showDots={false}
          />
        </div>
      </div>

      {/* Net Income (After Taxes & Insurance) */}
      <div
        className={`rounded-lg border p-6 transition-colors hover:shadow-md ${
          metrics.netIncome >= 0
            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700'
            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Nettoeinkommen
          </h3>
          <TrendingUp
            className={`h-5 w-5 ${getStatusColor(metrics.netIncome)}`}
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          {getDataTypeBadge(dataViewMode)}
          <TrendBadge
            trend={netIncomeChange.trend}
            percentage={netIncomeChange.percentage}
            size="sm"
            severity={getSeverityForTrend(netIncomeChange.trend, true)}
          />
        </div>
        <p
          className={`text-3xl font-bold ${getStatusColor(metrics.netIncome)}`}
        >
          {formatEuro(metrics.netIncome)}
        </p>
        {/* Sparkline */}
        <div className="mt-3 h-8">
          <Sparkline
            data={[50, 58, 55, 68, 75, 80, 85]}
            color="blue"
            height={32}
            filled
            showDots={false}
          />
        </div>
      </div>

      {/* Average Session Price */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Durchschn. Sitzungspreis
          </h3>
          <Users className="h-5 w-5 text-purple-500" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          {getDataTypeBadge(dataViewMode)}
          <TrendBadge
            trend={avgPriceChange.trend}
            percentage={avgPriceChange.percentage}
            size="sm"
            severity={getSeverityForTrend(avgPriceChange.trend, true)}
          />
        </div>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {formatEuro(metrics.averageSessionPrice)}
        </p>
        {/* Sparkline */}
        <div className="mt-3 h-6">
          <Sparkline
            data={[75, 76, 75, 77, 77, 78, 78]}
            color="neutral"
            height={24}
            filled
            showDots={false}
          />
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          Über alle Therapien
        </p>
      </div>

      {/* Sessions */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:border-teal-300 dark:hover:border-teal-600 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            {dataViewMode === 'prognose' ? 'Geplante Sitzungen' : 'Sitzungen'}
          </h3>
          <BarChart3 className="h-5 w-5 text-teal-500" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          {getDataTypeBadge(dataViewMode)}
          <TrendBadge
            trend={sessionsChange.trend}
            percentage={sessionsChange.percentage}
            size="sm"
            severity={getSeverityForTrend(sessionsChange.trend, true)}
          />
        </div>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {dataViewMode === 'prognose' ? metrics.totalPlannedSessions : metrics.totalSessions}
        </p>
        {/* Sparkline */}
        <div className="mt-3 h-6 mb-3">
          <Sparkline
            data={[35, 38, 40, 42, 44, 45, 46]}
            color="blue"
            height={24}
            filled
            showDots={false}
          />
        </div>
        {dataViewMode === 'resultate' && (
          <div className="mt-2 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-300"
              style={{
                width: `${Math.min((metrics.totalSessions / Math.max(metrics.totalPlannedSessions, 1)) * 100, 100)}%`
              }}
            />
          </div>
        )}
      </div>

    </div>
  )
}
