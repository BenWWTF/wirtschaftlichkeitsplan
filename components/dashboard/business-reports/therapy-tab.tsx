'use client'

import type { AdvancedAnalytics } from '@/lib/actions/analytics'
import type { TherapyMetrics } from '@/lib/actions/dashboard'
import { formatEuro } from '@/lib/utils'
import { MetricCard } from './components/metric-card'
import { Euro, TrendingUp } from 'lucide-react'

interface TherapyTabProps {
  analytics: AdvancedAnalytics | null
  therapies?: TherapyMetrics[]
}

export function TherapyTab({ analytics }: TherapyTabProps) {
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
        {/* Top Therapy by Revenue */}
        {analytics.topTherapyByRevenue && (
          <MetricCard
            label="Top Therapie (Umsatz)"
            value={formatEuro(analytics.topTherapyByRevenue.revenue)}
            icon={<Euro className="h-5 w-5 text-green-500" />}
            subtext={`${analytics.topTherapyByRevenue.name} • ${analytics.topTherapyByRevenue.sessions} Sitzungen`}
            variant="success"
          />
        )}

        {/* Top Therapy by Margin */}
        {analytics.topTherapyByMargin && (
          <MetricCard
            label="Top Therapie (Deckungsbeitrag)"
            value={formatEuro(analytics.topTherapyByMargin.margin)}
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
            subtext={`${analytics.topTherapyByMargin.name} • ${analytics.topTherapyByMargin.marginPercent.toFixed(1)}% Marge`}
            variant="success"
          />
        )}

        {/* Average Session Price */}
        <MetricCard
          label="Ø Sitzungspreis"
          value={formatEuro(analytics.averageSessionPrice)}
          icon={<Euro className="h-5 w-5 text-purple-500" />}
          subtext="Mittelwert aller Therapiearten"
        />

        {/* Occupancy Rate */}
        <MetricCard
          label="Auslastungsquote"
          value={`${analytics.occupancyRate.toFixed(1)}%`}
          subtext={
            analytics.occupancyRate >= 80
              ? 'Ausgezeichnet'
              : analytics.occupancyRate >= 60
              ? 'Gut'
              : 'Verbesserung möglich'
          }
          variant={
            analytics.occupancyRate >= 80
              ? 'success'
              : analytics.occupancyRate >= 60
              ? 'success'
              : 'warning'
          }
        />
      </div>

      {/* Occupancy Rate Progress Bar */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
          Sitzungsauslastung Details
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Geplante vs. durchgeführte Sitzungen</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">{analytics.occupancyRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  analytics.occupancyRate >= 80
                    ? 'bg-green-500'
                    : analytics.occupancyRate >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(analytics.occupancyRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
