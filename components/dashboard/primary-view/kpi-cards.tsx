/**
 * KPI Cards Component
 * Displays primary metrics in a grid layout
 */

import { DollarSign, TrendingUp, TrendingDown, Users, BarChart3, CreditCard } from 'lucide-react'
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
  // Calculate gross income (net revenue - expenses)
  const grossIncome = metrics.totalNetRevenue - metrics.totalExpenses

  return (
    <div className="space-y-6">
      {/* Revenue Flow Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-4">
          Umsatzubersicht
        </h3>
        <div className="space-y-3">
          {/* Gross Revenue */}
          <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Bruttoumsatz</span>
            </div>
            <span className="text-lg font-semibold text-neutral-900 dark:text-white">
              {formatEuro(metrics.totalRevenue)}
            </span>
          </div>

          {/* Payment Fees (shown in red) */}
          <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-red-500" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                Zahlungsgebuhren ({metrics.paymentFeePercentage.toFixed(2)}%)
              </span>
            </div>
            <span className="text-lg font-semibold text-red-600 dark:text-red-400">
              -{formatEuro(metrics.totalPaymentFees)}
            </span>
          </div>

          {/* Net Revenue (highlighted) */}
          <div className="flex items-center justify-between py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg px-3 -mx-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Nettoumsatz</span>
            </div>
            <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {formatEuro(metrics.totalNetRevenue)}
            </span>
          </div>

          {/* Fixed Costs */}
          <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Fixkosten & Ausgaben</span>
            </div>
            <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              -{formatEuro(metrics.totalExpenses)}
            </span>
          </div>

          {/* Monthly Profit (green if positive, red if negative) */}
          <div className={`flex items-center justify-between py-3 rounded-lg px-3 -mx-3 ${
            grossIncome >= 0
              ? 'bg-green-50 dark:bg-green-950/30'
              : 'bg-red-50 dark:bg-red-950/30'
          }`}>
            <div className="flex items-center gap-2">
              <BarChart3 className={`h-4 w-4 ${getStatusColor(grossIncome)}`} />
              <span className={`text-sm font-medium ${
                grossIncome >= 0
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                Bruttoeinkommen
              </span>
            </div>
            <span className={`text-lg font-bold ${getStatusColor(grossIncome)}`}>
              {formatEuro(grossIncome)}
            </span>
          </div>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
          {metrics.totalSessions} Sitzungen | {metrics.marginPercent.toFixed(1)}% Bruttomarge
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Payment Fees Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
              Zahlungsgebuhren
            </h3>
            <CreditCard className="h-5 w-5 text-red-500" />
          </div>
          {getDataTypeBadge(dataViewMode)}
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            -{formatEuro(metrics.totalPaymentFees)}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            SumUp {metrics.paymentFeePercentage.toFixed(2)}% Transaktionsgebuhr
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
            Uber alle Therapien
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
    </div>
  )
}
