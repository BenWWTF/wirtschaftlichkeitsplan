'use client'

import Link from 'next/link'
import type { DashboardSummary } from '@/lib/actions/dashboard'
import { formatEuro } from '@/lib/utils'
import { MetricCard } from './components/metric-card'
import { Euro, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TaxesTabProps {
  summary: DashboardSummary
}

export function TaxesTab({ summary }: TaxesTabProps) {
  const grossRevenue = summary.total_revenue
  const totalExpenses = summary.total_expenses
  const netIncome = summary.net_income

  if (grossRevenue === 0) {
    return (
      <div className="py-6 text-center text-neutral-600 dark:text-neutral-400">
        Keine Daten verfügbar
      </div>
    )
  }

  // Approximate tax burden (simplified: ~30-40% of net income for Austria)
  const estimatedTaxBurden = netIncome * 0.35
  const netAfterTax = netIncome - estimatedTaxBurden

  return (
    <div className="py-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Bruttoumsatz"
          value={formatEuro(grossRevenue)}
          icon={<Euro className="h-5 w-5 text-blue-500" />}
        />

        <MetricCard
          label="Nettoeinkommen (vor Steuern)"
          value={formatEuro(netIncome)}
          icon={<Euro className="h-5 w-5 text-amber-500" />}
        />

        <MetricCard
          label="Nach Steuern (geschätzt)"
          value={formatEuro(netAfterTax)}
          icon={<Euro className="h-5 w-5 text-green-500" />}
          variant={netAfterTax > 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Estimated Tax Burden */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
          Geschätzte Steuerlast
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded">
            <span className="text-neutral-700 dark:text-neutral-300">Nettoeinkommen</span>
            <span className="font-semibold text-neutral-900 dark:text-white">
              {formatEuro(netIncome)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded">
            <span className="text-red-700 dark:text-red-200">Geschätzte Steuern (35%)</span>
            <span className="font-semibold text-red-900 dark:text-red-100">
              {formatEuro(estimatedTaxBurden)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 border-t border-neutral-200 dark:border-neutral-700 font-semibold">
            <span className="text-neutral-900 dark:text-white">Nach Steuern</span>
            <span className="text-neutral-900 dark:text-white">
              {formatEuro(netAfterTax)}
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-4">
          Diese Schätzung basiert auf vereinfachten Annahmen (35% Gesamtbelastung). Die tatsächliche Steuerlast hängt
          von Ihrer Praxisform, Gewinnabgrenzung und lokalen Faktoren ab.
        </p>
      </div>

      {/* Call to Action */}
      <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <TrendingUp className="h-5 w-5 text-accent-600 dark:text-accent-400" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-semibold text-accent-900 dark:text-accent-100 mb-1">
                Detaillierte Steuerplanung
              </h3>
              <p className="text-sm text-accent-800 dark:text-accent-200">
                Nutzen Sie unser Steuerschätzungs-Tool um verschiedene Szenarien durchzuspielen,
                Optimierungsmöglichkeiten zu erkunden und Ihre Steuerlast zu planen.
              </p>
            </div>
            <Link href="/dashboard/steuerprognose">
              <Button className="w-full sm:w-auto">
                Zur Steuerprognose
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Hinweis:</strong> Diese Übersicht basiert auf vereinfachten Berechnungen und dient nur der Orientierung.
            Für eine verbindliche Steuerberechnung und professionelle Beratung konsultieren Sie bitte einen Steuerberater.
          </p>
        </div>
      </div>
    </div>
  )
}
