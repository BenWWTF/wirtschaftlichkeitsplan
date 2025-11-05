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
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

interface BreakEvenCalculatorProps {
  therapies: BreakEvenAnalysis[]
  initialFixedCosts?: number
}

export function BreakEvenCalculator({
  therapies,
  initialFixedCosts = 2000
}: BreakEvenCalculatorProps) {
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

        <div className="space-y-3">
          {therapies.map((therapy) => {
            const sessionsNeeded =
              therapy.contribution_margin > 0
                ? Math.ceil(fixedCosts / therapy.contribution_margin)
                : 0

            return (
              <div
                key={therapy.therapy_type_id}
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-lg"
              >
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {therapy.therapy_type_name}
                  </p>
                  <div className="flex gap-4 text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    <span>
                      Preis: {formatEuro(therapy.price_per_session)}
                    </span>
                    <span>
                      Deckungsbeitrag: {formatEuro(
                        therapy.contribution_margin
                      )}{' '}
                      ({therapy.contribution_margin_percent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {sessionsNeeded}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Sitzungen
                  </p>
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

      {/* Info Box */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          💡 <strong>Hinweis:</strong> Diese Analyse basiert auf durchschnittlichen
          Deckungsbeiträgen. Die tatsächliche Anzahl der benötigten Sitzungen kann je
          nach Ihre Therapieart-Mix variieren.
        </p>
      </div>
    </div>
  )
}
