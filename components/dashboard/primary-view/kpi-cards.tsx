'use client'

/**
 * KPI Cards Component
 * Displays primary metrics in a grid layout with animations
 */

import { Banknote, TrendingUp, TrendingDown, Users, BarChart3, CreditCard } from 'lucide-react'
import type { UnifiedMetricsResponse } from '@/lib/metrics/unified-metrics'
import type { MonthlySnapshot } from '@/lib/metrics/historical-metrics'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import { AnimatedSection } from '@/components/ui/animated-section'
import { AnimatedBar } from '@/components/ui/animated-bar'
import { Sparkline } from '@/components/ui/sparkline'

interface KPICardsProps {
  metrics: UnifiedMetricsResponse
  dataViewMode?: 'prognose' | 'resultate'
  historicalData?: MonthlySnapshot[]
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
      <span className="inline-block px-2 py-1 bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-200 text-xs font-semibold rounded">
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

function AnimatedEuro({ value, className }: { value: number; className?: string }) {
  const animated = useAnimatedNumber(value, { duration: 1000, decimals: 2 })
  return <span className={`tabular-nums ${className ?? ''}`}>{formatEuro(animated)}</span>
}

function AnimatedInteger({ value, className }: { value: number; className?: string }) {
  const animated = useAnimatedNumber(value, { duration: 1000, decimals: 0 })
  return <span className={`tabular-nums ${className ?? ''}`}>{Math.round(animated)}</span>
}

export function KPICards({ metrics, dataViewMode, historicalData }: KPICardsProps) {
  // Calculate gross income (net revenue - expenses)
  const grossIncome = metrics.totalNetRevenue - metrics.totalExpenses

  // Extract sparkline data arrays from historical snapshots
  const netRevenueHistory = historicalData?.map((s) => s.totalNetRevenue) ?? []
  const netIncomeHistory = historicalData?.map((s) => s.netIncome) ?? []
  const sessionsHistory = historicalData?.map((s) => s.totalSessions) ?? []
  const avgPriceHistory = historicalData?.map((s) => s.averageSessionPrice) ?? []

  return (
    <div className="space-y-6">
      {/* Revenue Flow Section */}
      <AnimatedSection animation="fade-up">
      <div className="bg-white/60 backdrop-blur-lg border-white/20 dark:bg-neutral-800/50 dark:backdrop-blur-lg dark:border-white/5 rounded-lg p-6 tabular-nums">
        <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-4">
          Umsatzubersicht
        </h3>
        <div className="space-y-3">
          {/* Gross Revenue */}
          <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-accent-500" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Bruttoumsatz</span>
            </div>
            <AnimatedEuro value={metrics.totalRevenue} className="text-lg font-semibold text-neutral-900 dark:text-white" />
          </div>

          {/* Payment Fees (shown in red) */}
          <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-red-500" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                Zahlungsgebühren ({metrics.paymentFeePercentage.toFixed(2)}%)
              </span>
            </div>
            <span className="text-lg font-semibold text-red-600 dark:text-red-400">
              -<AnimatedEuro value={metrics.totalPaymentFees} />
            </span>
          </div>

          {/* Net Revenue (highlighted) */}
          <div className="flex items-center justify-between py-2 bg-accent-50 dark:bg-accent-950/20 rounded-lg px-3 -mx-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent-600 dark:text-accent-400" />
              <span className="text-sm font-medium text-accent-700 dark:text-accent-300">Nettoumsatz</span>
            </div>
            <div className="flex items-center gap-3">
              {netRevenueHistory.length >= 2 && (
                <Sparkline data={netRevenueHistory} width={60} height={20} filled />
              )}
              <AnimatedEuro value={metrics.totalNetRevenue} className="text-lg font-bold text-accent-700 dark:text-accent-300" />
            </div>
          </div>

          {/* Fixed Costs */}
          <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Fixkosten & Ausgaben</span>
            </div>
            <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              -<AnimatedEuro value={metrics.totalExpenses} />
            </span>
          </div>

          {/* Monthly Profit (green if positive, red if negative) */}
          <div className={`flex items-center justify-between py-3 rounded-lg px-3 -mx-3 ${
            grossIncome >= 0
              ? 'bg-green-50 dark:bg-green-950/20'
              : 'bg-red-50 dark:bg-red-950/20'
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
            <AnimatedEuro value={grossIncome} className={`text-lg font-bold ${getStatusColor(grossIncome)}`} />
          </div>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
          {metrics.totalSessions} Sitzungen | {metrics.marginPercent.toFixed(1)}% Bruttomarge
        </p>
      </div>
      </AnimatedSection>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Income (After Taxes & Insurance) */}
        <AnimatedSection animation="fade-up" delay={0}>
        <div
          className={`rounded-lg p-6 card-hover border-l-4 ${
            metrics.netIncome >= 0
              ? 'border-l-green-500 bg-accent-50/60 backdrop-blur-lg border border-accent-200/30 dark:bg-accent-950/20 dark:backdrop-blur-lg dark:border-accent-800/20 dark:border-l-green-500'
              : 'border-l-red-500 bg-red-50/60 backdrop-blur-lg border border-red-200/30 dark:bg-red-950/20 dark:backdrop-blur-lg dark:border-red-800/20 dark:border-l-red-500'
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
            <AnimatedEuro value={metrics.netIncome} />
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Nach Steuern & Versicherungen
            </p>
            {netIncomeHistory.length >= 2 && (
              <Sparkline data={netIncomeHistory} width={60} height={20} filled />
            )}
          </div>
        </div>
        </AnimatedSection>

        {/* Payment Fees Card */}
        <AnimatedSection animation="fade-up" delay={75}>
        <div className="bg-white/60 backdrop-blur-lg border-white/20 dark:bg-neutral-800/50 dark:backdrop-blur-lg dark:border-white/5 rounded-lg p-6 card-hover border-l-4 border-l-red-400 dark:border-l-red-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
              Zahlungsgebühren
            </h3>
            <CreditCard className="h-5 w-5 text-red-500" />
          </div>
          {getDataTypeBadge(dataViewMode)}
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            -<AnimatedEuro value={metrics.totalPaymentFees} />
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            SumUp {metrics.paymentFeePercentage.toFixed(2)}% Transaktionsgebuhr
          </p>
        </div>
        </AnimatedSection>

        {/* Average Session Price */}
        <AnimatedSection animation="fade-up" delay={150}>
        <div className="bg-white/60 backdrop-blur-lg border-white/20 dark:bg-neutral-800/50 dark:backdrop-blur-lg dark:border-white/5 rounded-lg p-6 card-hover border-l-4 border-l-purple-400 dark:border-l-purple-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
              Durchschn. Sitzungspreis
            </h3>
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          {getDataTypeBadge(dataViewMode)}
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">
            <AnimatedEuro value={metrics.averageSessionPrice} />
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Uber alle Therapien
            </p>
            {avgPriceHistory.length >= 2 && (
              <Sparkline data={avgPriceHistory} width={60} height={20} filled />
            )}
          </div>
        </div>
        </AnimatedSection>

        {/* Sessions */}
        <AnimatedSection animation="fade-up" delay={225}>
        <div className="bg-white/60 backdrop-blur-lg border-white/20 dark:bg-neutral-800/50 dark:backdrop-blur-lg dark:border-white/5 rounded-lg p-6 card-hover border-l-4 border-l-teal-400 dark:border-l-teal-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
              {dataViewMode === 'prognose' ? 'Geplante Sitzungen' : 'Sitzungen'}
            </h3>
            <BarChart3 className="h-5 w-5 text-teal-500" />
          </div>
          {getDataTypeBadge(dataViewMode)}
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">
            <AnimatedInteger value={dataViewMode === 'prognose' ? metrics.totalPlannedSessions : metrics.totalSessions} />
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex-1">
              {/* Placeholder for consistent layout */}
            </div>
            {sessionsHistory.length >= 2 && (
              <Sparkline data={sessionsHistory} width={60} height={20} filled />
            )}
          </div>
          {dataViewMode === 'resultate' && (
            <div className="mt-2">
              <AnimatedBar
                percentage={Math.min((metrics.totalSessions / Math.max(metrics.totalPlannedSessions, 1)) * 100, 100)}
                colorClass="bg-teal-500"
                duration={1200}
                delay={400}
              />
            </div>
          )}
        </div>
        </AnimatedSection>
      </div>

    </div>
  )
}
