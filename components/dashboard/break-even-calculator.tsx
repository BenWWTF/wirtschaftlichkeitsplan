'use client'

import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { BreakEvenAnalysis } from '@/lib/types'
import { PracticeSettingsSchema, type PracticeSettingsInput } from '@/lib/validations'
import { formatEuro } from '@/lib/utils'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TrendingUp, AlertCircle, CheckCircle, BarChart3, History } from 'lucide-react'
import { BreakEvenChart } from './break-even-chart'
import { BreakEvenHistory } from './break-even-history'
import { BreakEvenExport } from './break-even-export'
import { Button } from '@/components/ui/button'

interface BreakEvenCalculatorProps {
  therapies: BreakEvenAnalysis[]
  initialFixedCosts?: number
}

export function BreakEvenCalculator({
  therapies,
  initialFixedCosts = 2000
}: BreakEvenCalculatorProps) {
  const [showCharts, setShowCharts] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  const form = useForm<PracticeSettingsInput>({
    resolver: zodResolver(PracticeSettingsSchema),
    defaultValues: {
      practice_name: '',
      practice_type: 'wahlarzt',
      monthly_fixed_costs: initialFixedCosts,
      average_variable_cost_per_session: 0,
      expected_growth_rate: 0
    }
  })

  const fixedCosts = form.watch('monthly_fixed_costs')

  // Calculate break-even metrics
  const calculations = useMemo(() => {
    if (therapies.length === 0) {
      return null
    }

    // Calculate weighted average contribution margin
    const totalContribution = therapies.reduce(
      (sum, t) => sum + t.contribution_margin,
      0
    )
    const avgContribution = totalContribution / therapies.length
    const avgContributionPercent =
      therapies.reduce(
        (sum, t) => sum + t.contribution_margin_percent,
        0
      ) / therapies.length

    // Sessions needed for break-even
    const sessionsNeeded =
      avgContribution > 0
        ? Math.ceil(fixedCosts / avgContribution)
        : 0

    // Optimistic and pessimistic scenarios
    const minContribution = Math.min(
      ...therapies.map((t) => t.contribution_margin)
    )
    const maxContribution = Math.max(
      ...therapies.map((t) => t.contribution_margin)
    )

    const sessionsNeededMin = maxContribution > 0 ? Math.ceil(fixedCosts / maxContribution) : 0
    const sessionsNeededMax = minContribution > 0 ? Math.ceil(fixedCosts / minContribution) : Infinity

    // Monthly profit scenarios at different session counts
    const baselineProfit = (sessionsNeeded * avgContribution - fixedCosts)
    const optimisticProfit = (sessionsNeeded * maxContribution - fixedCosts)
    const pessimisticProfit = (sessionsNeeded * minContribution - fixedCosts)

    return {
      avgContribution,
      avgContributionPercent,
      sessionsNeeded,
      sessionsNeededMin,
      sessionsNeededMax,
      baselineProfit,
      optimisticProfit,
      pessimisticProfit,
      minContribution,
      maxContribution
    }
  }, [therapies, fixedCosts])

  if (!calculations || therapies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
          Keine Therapiearten vorhanden
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Erstellen Sie zuerst Therapiearten, um die Break-Even-Analyse zu verwenden.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Ihre Fixkosten
        </h3>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="monthly_fixed_costs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monatliche Fixkosten (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2000"
                      step="100"
                      min="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Miete, Versicherungen, Gehälter, Marketing, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {/* Break-Even Analysis Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-start gap-4">
          <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
              Break-Even-Analyse
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main Metric */}
              <div className="bg-white dark:bg-neutral-900 rounded p-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  Sitzungen pro Monat für Break-Even
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {calculations.sessionsNeeded}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  durchschnittlich {calculations.avgContribution.toFixed(2)} € Deckungsbeitrag pro Sitzung
                </p>
              </div>

              {/* Range */}
              <div className="bg-white dark:bg-neutral-900 rounded p-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  Realistische Spanne
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {calculations.sessionsNeededMin} - {
                    calculations.sessionsNeededMax === Infinity
                      ? '∞'
                      : calculations.sessionsNeededMax
                  }
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  je nach Therapieart-Mix
                </p>
              </div>

              {/* Profitability */}
              <div className="bg-white dark:bg-neutral-900 rounded p-4 md:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Wenn Sie {calculations.sessionsNeeded} Sitzungen durchführen:
                  </span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatEuro(calculations.baselineProfit)}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Gewinn nach Fixkosten
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Therapy Type Details */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Therapiearten-Analyse
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Break-Even-Berechnung basiert auf Netto-Einnahmen nach Abzug der SumUp-Zahlungsgebuehr (1,39%)
        </p>

        <div className="space-y-4">
          {therapies.map((therapy) => {
            const sessionsNeeded =
              therapy.contribution_margin > 0
                ? Math.ceil(fixedCosts / therapy.contribution_margin)
                : 0

            return (
              <div
                key={therapy.therapy_type_id}
                className="p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {therapy.therapy_type_name}
                  </p>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {sessionsNeeded}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Sitzungen fuer Break-Even
                    </p>
                  </div>
                </div>

                {/* Price breakdown with payment fees */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white dark:bg-neutral-800 rounded p-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Brutto-Preis</p>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {formatEuro(therapy.price_per_session)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-neutral-800 rounded p-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Zahlungsgebuehr (1,39%)</p>
                    <p className="font-medium text-red-600 dark:text-red-400">
                      -{formatEuro(therapy.payment_fee_per_session)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-neutral-800 rounded p-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Variable Kosten</p>
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      -{formatEuro(therapy.variable_cost_per_session)}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Deckungsbeitrag</p>
                    <p className="font-semibold text-blue-700 dark:text-blue-300">
                      {formatEuro(therapy.contribution_margin)}
                    </p>
                  </div>
                </div>

                {/* Net revenue highlight */}
                <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Netto-Einnahmen pro Sitzung: {formatEuro(therapy.net_revenue_per_session)} |
                  DB-Quote: {therapy.contribution_margin_percent.toFixed(1)}%
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sensitivity Analysis */}
      <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Sensitivitätsanalyse
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded">
            <span className="text-neutral-600 dark:text-neutral-400">
              Pessimistisch (nur beste Therapieart):
            </span>
            <span className="font-semibold text-neutral-900 dark:text-white">
              {calculations.sessionsNeededMax === Infinity
                ? '–'
                : calculations.sessionsNeededMax}{' '}
              Sitzungen
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded">
            <span className="text-neutral-600 dark:text-neutral-400">
              Realistisch (Durchschnitt):
            </span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {calculations.sessionsNeeded} Sitzungen
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded">
            <span className="text-neutral-600 dark:text-neutral-400">
              Optimistisch (nur beste Therapieart):
            </span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {calculations.sessionsNeededMin} Sitzungen
            </span>
          </div>
        </div>
      </div>

      {/* Toggle buttons and export */}
      <div className="flex flex-wrap gap-2 justify-center items-center">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-sm"
          aria-label={showCharts ? 'Verberge Diagramme' : 'Zeige Diagramme'}
        >
          <BarChart3 className="h-5 w-5" />
          {showCharts ? 'Verberge Diagramme' : 'Zeige Interaktive Diagramme'}
        </button>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white font-medium rounded-lg transition-colors shadow-sm"
          aria-label={showHistory ? 'Verberge Verlauf' : 'Zeige Verlauf'}
        >
          <History className="h-5 w-5" />
          {showHistory ? 'Verberge Verlauf' : 'Zeige Break-Even-Verlauf'}
        </button>
        <BreakEvenExport
          therapies={therapies}
          fixedCosts={fixedCosts}
          sessionsNeeded={calculations?.sessionsNeeded || 0}
        />
      </div>

      {/* Interactive Charts */}
      {showCharts && (
        <div className="pt-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Interaktive Visualisierungen
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Visualisieren Sie Ihre Break-Even-Analyse mit interaktiven Diagrammen
            </p>
          </div>
          <BreakEvenChart therapies={therapies} fixedCosts={fixedCosts} />
        </div>
      )}

      {/* Break-Even History */}
      {showHistory && (
        <div className="pt-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Break-Even-Verlauf
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Verfolgen Sie, wie sich Ihre Break-Even-Punkte über mehrere Monate hinweg entwickeln
            </p>
          </div>
          <BreakEvenHistory fixedCosts={fixedCosts} />
        </div>
      )}

    </div>
  )
}
