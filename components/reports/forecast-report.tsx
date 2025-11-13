'use client'

import { useEffect, useState } from 'react'
import { getAdvancedAnalytics } from '@/lib/actions/analytics'
import type { AdvancedAnalytics } from '@/lib/actions/analytics'
import { formatEuro } from '@/lib/utils'
import { AlertCircle, Sparkles, MapPin, CheckCircle2, AlertTriangle, XCircle, Lightbulb, Target, TrendingUp } from 'lucide-react'

export function ForecastReport() {
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
        console.error('Failed to load analytics:', err)
        setError('Failed to load report data')
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="bg-neutral-200 dark:bg-neutral-700 rounded-lg h-24 animate-pulse" />
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
            {error || 'No data available'}
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
            Create historical data to generate forecasts.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
          Prognose & Ziele
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Forecast */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Umsatzprognose (nächster Monat)
              </h3>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatEuro(analytics.forecastedRevenue)}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Basierend auf aktueller Entwicklung
              </p>
              {analytics.revenueTrend !== null && (
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-900">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Aktueller Trend: {analytics.revenueTrend > 0 ? '+' : ''}{analytics.revenueTrend.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Break-Even Analysis */}
          {isFinite(analytics.sessionsToBreakEven) && analytics.sessionsToBreakEven >= 0 ? (
            <div className={`rounded-lg p-4 border ${
              analytics.sessionsToBreakEven <= 5
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900'
                : analytics.sessionsToBreakEven <= 10
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className={`h-5 w-5 ${
                  analytics.sessionsToBreakEven <= 5
                    ? 'text-green-600'
                    : analytics.sessionsToBreakEven <= 10
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`} />
                <h3 className={`text-sm font-medium ${
                  analytics.sessionsToBreakEven <= 5
                    ? 'text-green-900 dark:text-green-100'
                    : analytics.sessionsToBreakEven <= 10
                    ? 'text-yellow-900 dark:text-yellow-100'
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  Break-Even Distanz
                </h3>
              </div>
              <div className="space-y-2">
                <p className={`text-3xl font-bold ${
                  analytics.sessionsToBreakEven <= 5
                    ? 'text-green-600 dark:text-green-400'
                    : analytics.sessionsToBreakEven <= 10
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {Math.round(analytics.sessionsToBreakEven)}
                </p>
                <p className={`text-xs ${
                  analytics.sessionsToBreakEven <= 5
                    ? 'text-green-700 dark:text-green-300'
                    : analytics.sessionsToBreakEven <= 10
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  Sitzungen bis Break-Even
                </p>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1">
                    {analytics.sessionsToBreakEven <= 5 ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Sehr nah am Break-Even
                        </p>
                      </>
                    ) : analytics.sessionsToBreakEven <= 10 ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                          Moderater Abstand
                        </p>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <p className="text-xs text-red-700 dark:text-red-300">
                          Großer Abstand zum Break-Even
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="text-sm font-medium text-red-900 dark:text-red-100">
                  Break-Even Status
                </h3>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300">
                Negative Deckungsbeitrag - Break-Even nicht erreichbar mit aktuellen Preisen
              </p>
            </div>
          )}

          {/* Profitability Outlook */}
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Rentabilitätsausblick
              </h3>
            </div>
            <div className="space-y-2">
              {analytics.profitMarginPercent >= 30 ? (
                <div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      Ausgezeichnete Rentabilität
                    </p>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    Ihre aktuelle Gewinnmarge ist gesund. Fokussieren Sie auf Wachstum.
                  </p>
                </div>
              ) : analytics.profitMarginPercent >= 10 ? (
                <div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                      Moderate Rentabilität
                    </p>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    Optimieren Sie Kosten oder erhöhen Sie Preise für bessere Margen.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      Geringe Rentabilität
                    </p>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    Sofortige Maßnahmen erforderlich - Kosten reduzieren oder Preise erhöhen.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Growth Recommendations */}
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Wachstumsempfehlungen
              </h3>
            </div>
            <div className="space-y-2">
              {analytics.occupancyRate < 80 ? (
                <div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <p className="text-xs font-medium text-neutral-900 dark:text-white">
                      Auslastung erhöhen
                    </p>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    Aktuelle Auslastung: {analytics.occupancyRate.toFixed(1)}%
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-neutral-900 dark:text-white">
                    ✅ Auslastung optimal
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    Über 80% Auslastung erreicht
                  </p>
                </div>
              )}
              {analytics.profitMarginPercent < 30 ? (
                <div>
                  <p className="text-xs font-medium text-neutral-900 dark:text-white">
                    💰 Kostenoptimierung
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    Prüfen Sie variable und Fixkosten
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-neutral-900 dark:text-white">
                    ✅ Kostenstruktur gesund
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    Fokus auf Umsatzwachstum
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
