/**
 * KPI Cards Component
 * Displays primary metrics in a grid layout
 */

import { DollarSign, TrendingUp, Users, BarChart3 } from 'lucide-react'
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

function getTrendIcon(value: number) {
  if (value > 5) return '📈'
  if (value > 0) return '↗️'
  if (value === 0) return '→'
  if (value > -5) return '↘️'
  return '📉'
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Revenue */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Gesamtumsatz
          </h3>
          <DollarSign className="h-5 w-5 text-blue-500" />
        </div>
        {getDataTypeBadge(dataViewMode)}
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {formatEuro(metrics.totalRevenue)}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {metrics.totalSessions} Sitzungen abgeschlossen
        </p>
      </div>

      {/* Total Expenses */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Ausgaben
          </h3>
          <TrendingUp className="h-5 w-5 text-orange-500" />
        </div>
        {getDataTypeBadge(dataViewMode)}
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {formatEuro(metrics.totalExpenses)}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          Budgetverfolgung aktiv
        </p>
      </div>

      {/* Gross Income (Revenue - Expenses) */}
      <div
        className={`rounded-lg border p-6 ${
          (metrics.totalRevenue - metrics.totalExpenses) >= 0
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Bruttoeinkommen
          </h3>
          <BarChart3
            className={`h-5 w-5 ${getStatusColor(metrics.totalRevenue - metrics.totalExpenses)}`}
          />
        </div>
        {getDataTypeBadge(dataViewMode)}
        <p
          className={`text-3xl font-bold ${getStatusColor(metrics.totalRevenue - metrics.totalExpenses)}`}
        >
          {formatEuro(metrics.totalRevenue - metrics.totalExpenses)}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {metrics.marginPercent.toFixed(1)}% Bruttomarge
        </p>
      </div>

      {/* Net Income (After Taxes & Insurance) */}
      <div
        className={`rounded-lg border p-6 ${
          metrics.netIncome >= 0
            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
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
        {getDataTypeBadge(dataViewMode)}
        <p
          className={`text-3xl font-bold ${getStatusColor(metrics.netIncome)}`}
        >
          {formatEuro(metrics.netIncome)}
        </p>
        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2">
          Nach Steuern & Versicherungen
        </p>
      </div>

      {/* Average Session Price */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Durchschn. Sitzungspreis
          </h3>
          <Users className="h-5 w-5 text-purple-500" />
        </div>
        {getDataTypeBadge(dataViewMode)}
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {formatEuro(metrics.averageSessionPrice)}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          Über alle Therapien
        </p>
      </div>

      {/* Sessions */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            {dataViewMode === 'prognose' ? 'Geplante Sitzungen' : 'Sitzungen'}
          </h3>
          <BarChart3 className="h-5 w-5 text-teal-500" />
        </div>
        {getDataTypeBadge(dataViewMode)}
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {dataViewMode === 'prognose' ? metrics.totalPlannedSessions : metrics.totalSessions}
        </p>
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
