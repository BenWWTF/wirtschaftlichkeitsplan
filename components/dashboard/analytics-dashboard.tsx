'use client'

import { useEffect, useState } from 'react'
import { getAdvancedAnalytics } from '@/lib/actions/analytics'
import type { AdvancedAnalytics } from '@/lib/actions/analytics'
import { KPICard } from './kpi-card'
import { formatEuro } from '@/lib/utils'
import {
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Activity,
  Target,
  Zap,
  AlertCircle,
} from 'lucide-react'

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getAdvancedAnalytics()
        setAnalytics(data)
      } catch (err) {
        console.error('Fehler beim Laden der Analysen:', err)
        setError('Fehler beim Laden der Analysedaten')
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="bg-neutral-200 dark:bg-neutral-700 rounded-lg h-32 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
            {error || 'Keine Daten verfügbar'}
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
            Stellen Sie sicher, dass Sie Therapietypen, Monatspläne und Ausgaben erstellt haben.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* First Row - Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupancy Rate */}
        <KPICard
          title="Auslastungsquote"
          value={analytics.occupancyRate.toFixed(1)}
          unit="%"
          icon={Activity}
          variant={analytics.occupancyRate >= 80 ? 'success' : analytics.occupancyRate >= 60 ? 'default' : 'warning'}
          description="Geplante vs. tatsächliche Sitzungen"
        />

        {/* Revenue per Session */}
        <KPICard
          title="Umsatz pro Sitzung"
          value={formatEuro(analytics.revenuePerSession)}
          icon={DollarSign}
          trend={analytics.revenueTrend}
          variant="success"
          description="Durchschnittlicher Preis"
        />

        {/* Cost per Session */}
        <KPICard
          title="Kosten pro Sitzung"
          value={formatEuro(analytics.costPerSession)}
          icon={BarChart3}
          trend={analytics.costTrend}
          variant={analytics.costTrend !== null && analytics.costTrend < 0 ? 'success' : 'default'}
          description="Variable Kosten"
        />

        {/* Profit Margin */}
        <KPICard
          title="Gewinnmarge"
          value={analytics.profitMarginPercent.toFixed(1)}
          unit="%"
          icon={TrendingUp}
          trend={analytics.profitTrend}
          variant={analytics.profitMarginPercent >= 30 ? 'success' : analytics.profitMarginPercent >= 10 ? 'default' : 'danger'}
          description="Netto-Einkommen vs. Umsatz"
        />
      </div>

      {/* Second Row - Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sessions Completed */}
        <KPICard
          title="Durchgeführte Sitzungen"
          value={Math.round(analytics.occupancyRate >= 0 ? analytics.occupancyRate : 0)}
          icon={Users}
          description="Aktuelle Periode"
        />

        {/* Best Performing Therapy by Revenue */}
        {analytics.topTherapyByRevenue ? (
          <KPICard
            title="Top Therapie (Umsatz)"
            value={formatEuro(analytics.topTherapyByRevenue.revenue)}
            icon={Zap}
            description={`${analytics.topTherapyByRevenue.name}`}
            variant="success"
          />
        ) : (
          <KPICard
            title="Top Therapie (Umsatz)"
            value="—"
            icon={Zap}
            description="Keine Daten verfügbar"
          />
        )}

        {/* Revenue Forecast */}
        <KPICard
          title="Umsatzprognose"
          value={formatEuro(analytics.forecastedRevenue)}
          icon={Target}
          description="Nächster Monat"
        />

        {/* Break-Even Distance */}
        {isFinite(analytics.sessionsToBreakEven) ? (
          <KPICard
            title="Break-Even Distanz"
            value={Math.round(analytics.sessionsToBreakEven)}
            unit="Sitzungen"
            icon={AlertCircle}
            variant={analytics.sessionsToBreakEven > 10 ? 'danger' : analytics.sessionsToBreakEven > 5 ? 'warning' : 'success'}
            description="Bis zur Gewinnschwelle"
          />
        ) : (
          <KPICard
            title="Break-Even Distanz"
            value="∞"
            icon={AlertCircle}
            description="Negative Deckungsbeitrag"
            variant="danger"
          />
        )}
      </div>

      {/* Third Row - Cost Structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cost Structure */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4">
            Kostenstruktur
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Variable Kosten
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {analytics.costStructure.variableCostsPercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.costStructure.variableCostsPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Fixkosten
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {analytics.costStructure.fixedCostsPercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.costStructure.fixedCostsPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Therapy by Margin */}
        {analytics.topTherapyByMargin ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4">
              Top Therapie (Marge)
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">
                  {analytics.topTherapyByMargin.name}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Marge
                  </span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatEuro(analytics.topTherapyByMargin.margin)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Margin %
                  </span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {analytics.topTherapyByMargin.marginPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Keine Daten verfügbar
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
