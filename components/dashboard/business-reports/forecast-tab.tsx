'use client'

import type { AdvancedAnalytics } from '@/lib/actions/analytics'
import { formatEuro } from '@/lib/utils'
import { MetricCard } from './components/metric-card'
import { TrendIndicator } from './components/trend-indicator'
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

interface ForecastTabProps {
  analytics: AdvancedAnalytics | null
}

export function ForecastTab({ analytics }: ForecastTabProps) {
  if (!analytics) {
    return (
      <div className="py-6 text-center text-neutral-600 dark:text-neutral-400">
        Keine Daten verfügbar
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Forecasted Revenue */}
        <MetricCard
          label="Prognostizierter Umsatz"
          value={formatEuro(analytics.forecastedRevenue)}
          icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          subtext="Basierend auf 3-Monats-Trend"
        />

        {/* Sessions to Break-Even */}
        <MetricCard
          label="Sitzungen bis Break-Even"
          value={Math.ceil(analytics.sessionsToBreakEven)}
          icon={<AlertCircle className="h-5 w-5 text-yellow-500" />}
          subtext="Basierend auf aktuellen Margen"
          variant={analytics.sessionsToBreakEven > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Break-Even Analysis */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Break-Even Analyse
        </h3>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Bei der aktuellen Gewinnmarge und Kostenstruktur benötigen Sie
          <span className="font-semibold text-neutral-900 dark:text-white ml-1">
            {Math.ceil(analytics.sessionsToBreakEven)} Sitzungen
          </span>
          , um die Fixkosten zu decken.
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded p-3">
            <p className="text-neutral-600 dark:text-neutral-400 mb-1">Gewinn pro Sitzung</p>
            <p className="font-semibold text-neutral-900 dark:text-white">
              {formatEuro(analytics.revenuePerSession - analytics.costPerSession)}
            </p>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded p-3">
            <p className="text-neutral-600 dark:text-neutral-400 mb-1">Trend</p>
            {analytics.profitTrend !== null && (
              <TrendIndicator
                value={analytics.profitTrend}
                showPercent={true}
                size="sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Empfehlungen
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          {analytics.profitMarginPercent < 20 && (
            <li>• Erhöhen Sie Ihre Sitzungspreise oder optimieren Sie Ihre Kostenstruktur</li>
          )}
          {analytics.occupancyRate < 70 && (
            <li>• Nutzen Sie verfügbare Kapazität durch gezielt Marketing</li>
          )}
          {analytics.revenuePerSession < 60 && (
            <li>• Konzentrieren Sie sich auf hochpreisige Therapiearten</li>
          )}
          {analytics.costPerSession > analytics.revenuePerSession * 0.5 && (
            <li>• Reduzieren Sie variable Kosten oder erhöhen Sie die Effizienz</li>
          )}
        </ul>
      </div>
    </div>
  )
}
