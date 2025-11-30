'use client'

import type { AdvancedAnalytics } from '@/lib/actions/analytics'
import { formatEuro } from '@/lib/utils'
import { MetricCard } from './components/metric-card'
import { TrendIndicator } from './components/trend-indicator'
import { Euro, PieChart, TrendingUp } from 'lucide-react'

interface FinancialTabProps {
  analytics: AdvancedAnalytics | null
}

export function FinancialTab({ analytics }: FinancialTabProps) {
  if (!analytics) {
    return (
      <div className="py-6 text-center text-neutral-600 dark:text-neutral-400">
        Keine Daten verfügbar
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Revenue per Session */}
        <MetricCard
          label="Umsatz pro Sitzung"
          value={formatEuro(analytics.revenuePerSession)}
          icon={<Euro className="h-5 w-5 text-blue-500" />}
          trend={
            analytics.revenueTrend !== null
              ? {
                  value: analytics.revenueTrend,
                  isPositive: analytics.revenueTrend >= 0,
                  label: 'vs. letzter Monat'
                }
              : undefined
          }
        />

        {/* Cost per Session */}
        <MetricCard
          label="Kosten pro Sitzung"
          value={formatEuro(analytics.costPerSession)}
          icon={<Euro className="h-5 w-5 text-red-500" />}
          trend={
            analytics.costTrend !== null
              ? {
                  value: analytics.costTrend,
                  isPositive: analytics.costTrend <= 0,
                  label: 'vs. letzter Monat'
                }
              : undefined
          }
        />

        {/* Profit Margin */}
        <MetricCard
          label="Gewinnmarge"
          value={`${analytics.profitMarginPercent.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          variant={
            analytics.profitMarginPercent >= 30
              ? 'success'
              : analytics.profitMarginPercent >= 10
              ? 'success'
              : 'warning'
          }
        />
      </div>

      {/* Cost Structure */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-purple-500" />
          Kostenstruktur
        </h3>

        <div className="space-y-4">
          {/* Variable Costs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Variable Kosten</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {analytics.costStructure.variableCostsPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-orange-500"
                style={{ width: `${analytics.costStructure.variableCostsPercent}%` }}
              />
            </div>
          </div>

          {/* Fixed Costs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Fixkosten</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {analytics.costStructure.fixedCostsPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${analytics.costStructure.fixedCostsPercent}%` }}
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-4">
          GesamtVariable Kosten: {formatEuro(analytics.totalVariableCosts)}
        </p>
      </div>
    </div>
  )
}
