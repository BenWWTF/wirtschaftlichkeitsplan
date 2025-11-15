/**
 * KPI Cards Component
 * Displays primary metrics in a grid layout
 */

import { DollarSign, TrendingUp, Users, BarChart3 } from 'lucide-react'
import type { UnifiedMetricsResponse } from '@/lib/metrics/unified-metrics'

interface KPICardsProps {
  metrics: UnifiedMetricsResponse
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

function getTrendIcon(value: number) {
  if (value > 5) return '📈'
  if (value > 0) return '↗️'
  if (value === 0) return '→'
  if (value > -5) return '↘️'
  return '📉'
}

export function KPICards({ metrics }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Revenue */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Revenue
          </h3>
          <DollarSign className="h-5 w-5 text-blue-500" />
        </div>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {formatEuro(metrics.totalRevenue)}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {metrics.totalSessions} sessions completed
        </p>
      </div>

      {/* Total Expenses */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Expenses
          </h3>
          <TrendingUp className="h-5 w-5 text-orange-500" />
        </div>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {formatEuro(metrics.totalExpenses)}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          Budget tracking active
        </p>
      </div>

      {/* Net Income */}
      <div
        className={`rounded-lg border p-6 ${
          metrics.netIncome >= 0
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Net Income
          </h3>
          <BarChart3
            className={`h-5 w-5 ${getStatusColor(metrics.netIncome)}`}
          />
        </div>
        <p
          className={`text-3xl font-bold ${getStatusColor(metrics.netIncome)}`}
        >
          {formatEuro(metrics.netIncome)}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {metrics.marginPercent.toFixed(1)}% margin
        </p>
      </div>

      {/* Average Session Price */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Avg Session Price
          </h3>
          <Users className="h-5 w-5 text-purple-500" />
        </div>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {formatEuro(metrics.averageSessionPrice)}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          Across all therapies
        </p>
      </div>

      {/* Sessions Progress */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Session Progress
          </h3>
          <BarChart3 className="h-5 w-5 text-teal-500" />
        </div>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {metrics.totalSessions}/{metrics.totalPlannedSessions}
        </p>
        <div className="mt-2 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 transition-all duration-300"
            style={{
              width: `${Math.min((metrics.totalSessions / Math.max(metrics.totalPlannedSessions, 1)) * 100, 100)}%`
            }}
          />
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {(
            (metrics.totalSessions /
              Math.max(metrics.totalPlannedSessions, 1)) *
            100
          ).toFixed(0)}% of target
        </p>
      </div>

      {/* Profitability Margin */}
      <div
        className={`rounded-lg border p-6 ${
          metrics.marginPercent >= 20
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            : metrics.marginPercent >= 0
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Profit Margin
          </h3>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </div>
        <p
          className={`text-3xl font-bold ${
            metrics.marginPercent >= 20
              ? 'text-green-600 dark:text-green-400'
              : metrics.marginPercent >= 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
          }`}
        >
          {metrics.marginPercent.toFixed(1)}%
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {metrics.marginPercent >= 20 && 'Healthy margin'}
          {metrics.marginPercent >= 0 && metrics.marginPercent < 20 && 'Needs improvement'}
          {metrics.marginPercent < 0 && 'Operating at loss'}
        </p>
      </div>
    </div>
  )
}
