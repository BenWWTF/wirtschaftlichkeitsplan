'use client'

import Link from 'next/link'
import type { DashboardSummary } from '@/lib/actions/dashboard'
import { formatEuro } from '@/lib/utils'
import { MetricCard } from './components/metric-card'
import { CHART_COLORS } from './components/chart-config'
import { Euro, TrendingUp, AlertCircle, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TaxesTabProps {
  summary: DashboardSummary
}

export function TaxesTab({ summary }: TaxesTabProps) {
  const grossRevenue = summary.total_revenue
  const fixedExpenses = summary.total_expenses
  const sumupCosts = summary.sumup_costs
  const netIncome = summary.net_income

  if (grossRevenue === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
          <Euro className="h-8 w-8 text-neutral-400" />
        </div>
        <p className="text-neutral-600 dark:text-neutral-400">Keine Daten verfügbar</p>
      </div>
    )
  }

  const estimatedTaxBurden = netIncome > 0 ? netIncome * 0.35 : 0
  const netAfterTax = netIncome - estimatedTaxBurden

  // Waterfall steps with running totals for the visual bar
  const waterfallSteps = [
    { label: 'Bruttoumsatz', value: grossRevenue, running: grossRevenue, type: 'total' as const },
    { label: 'Fixkosten', value: -fixedExpenses, running: grossRevenue - fixedExpenses, type: 'subtract' as const },
    { label: 'SumUp-Gebühren', value: -sumupCosts, running: grossRevenue - fixedExpenses - sumupCosts, type: 'subtract' as const },
    { label: 'Nettoeinkommen', value: netIncome, running: netIncome, type: 'subtotal' as const },
    { label: 'Geschätzte Steuern (35%)', value: -estimatedTaxBurden, running: netAfterTax, type: 'subtract' as const },
    { label: 'Nach Steuern', value: netAfterTax, running: netAfterTax, type: 'result' as const },
  ]

  // Calculate max for waterfall bar widths (use true max to prevent overflow)
  const maxValue = Math.max(grossRevenue, ...waterfallSteps.map(s => Math.abs(s.running)))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Bruttoumsatz"
          value={formatEuro(grossRevenue)}
          icon={<Euro className="h-5 w-5 text-accent-500" />}
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

      {/* Waterfall Breakdown */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-6">
          Vom Umsatz zum Gewinn
        </h3>
        <div className="space-y-1">
          {waterfallSteps.map((step, index) => {
            const isSubtract = step.type === 'subtract'
            const isResult = step.type === 'result'
            const isSubtotal = step.type === 'subtotal'
            const isTotal = step.type === 'total'

            // Bar width as percentage of max
            const barWidth = maxValue > 0
              ? Math.max(2, (Math.abs(step.running) / maxValue) * 100)
              : 0

            const barColor = isSubtract
              ? CHART_COLORS.loss
              : isResult
                ? netAfterTax >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss
                : isSubtotal
                  ? CHART_COLORS.sumupFees
                  : CHART_COLORS.revenue

            const bgColor = isResult
              ? netAfterTax >= 0
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
              : isSubtotal
                ? 'bg-amber-50 dark:bg-amber-900/10'
                : 'bg-transparent'

            const borderClass = (isSubtotal || isResult)
              ? 'border-t border-neutral-200 dark:border-neutral-700'
              : ''

            return (
              <div
                key={step.label}
                className={`${bgColor} ${borderClass} rounded-lg px-4 py-3 transition-colors`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-sm ${isResult || isSubtotal ? 'font-semibold' : 'font-medium'} text-neutral-900 dark:text-white flex items-center gap-1.5`}>
                    {isSubtract && <ArrowDown className="h-3 w-3 text-red-500" />}
                    {step.label}
                  </span>
                  <span className={`text-sm font-semibold tabular-nums ${
                    isSubtract || ((isSubtotal || isResult) && step.value < 0)
                      ? 'text-red-600 dark:text-red-400'
                      : isResult && netAfterTax >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-neutral-900 dark:text-white'
                  }`}>
                    {isSubtract || ((isSubtotal || isResult) && step.value < 0) ? '−' : ''}{formatEuro(Math.abs(step.value))}
                  </span>
                </div>
                {/* Visual bar */}
                <div className="w-full bg-neutral-100 dark:bg-neutral-700/50 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: barColor,
                      opacity: isSubtract ? 0.6 : 0.85,
                    }}
                  />
                </div>
              </div>
            )
          })}
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
      <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-6">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-accent-600 dark:text-accent-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-accent-800 dark:text-accent-200">
            <strong>Hinweis:</strong> Diese Übersicht basiert auf vereinfachten Berechnungen und dient nur der Orientierung.
            Für eine verbindliche Steuerberechnung und professionelle Beratung konsultieren Sie bitte einen Steuerberater.
          </p>
        </div>
      </div>
    </div>
  )
}
