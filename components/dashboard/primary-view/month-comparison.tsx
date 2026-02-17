'use client'

import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react'
import { AnimatedSection } from '@/components/ui/animated-section'

interface MonthMetrics {
  totalRevenue: number
  totalNetRevenue: number
  totalSessions: number
  totalExpenses: number
  netIncome: number
  averageSessionPrice: number
}

interface MonthComparisonProps {
  currentMetrics: MonthMetrics
  previousMetrics: MonthMetrics | null
  currentLabel: string
  previousLabel: string
}

interface MetricRow {
  label: string
  currentValue: number
  previousValue: number
  format: 'currency' | 'integer' | 'currency-short'
  /** If true, a decrease is good (e.g. expenses) */
  invertDelta: boolean
  unit?: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDeltaAbsolute(
  delta: number,
  format: 'currency' | 'integer' | 'currency-short',
  unit?: string
): string {
  const sign = delta > 0 ? '+' : ''
  if (format === 'currency' || format === 'currency-short') {
    return `(${sign}${formatCurrency(delta)})`
  }
  const suffix = unit ? ` ${unit}` : ''
  return `(${sign}${formatInteger(delta)}${suffix})`
}

function formatPercentChange(current: number, previous: number): string {
  if (previous === 0) {
    if (current === 0) return '0,0%'
    return current > 0 ? '+100%' : '-100%'
  }
  const change = ((current - previous) / Math.abs(previous)) * 100
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1).replace('.', ',')}%`
}

function ComparisonRow({ row }: { row: MetricRow }) {
  const delta = row.currentValue - row.previousValue
  const isPositive = row.invertDelta ? delta < 0 : delta > 0
  const isNegative = row.invertDelta ? delta > 0 : delta < 0
  const isNeutral = delta === 0

  const percentText = formatPercentChange(row.currentValue, row.previousValue)
  const absoluteText = formatDeltaAbsolute(delta, row.format, row.unit)

  const formattedValue =
    row.format === 'integer'
      ? formatInteger(row.currentValue)
      : formatCurrency(row.currentValue)

  // Delta pill colors
  let pillClasses = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
  if (isPositive) {
    pillClasses = 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
  } else if (isNegative) {
    pillClasses = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  }

  // Arrow icon
  let ArrowIcon = ArrowRight
  let arrowColor = 'text-neutral-500 dark:text-neutral-400'
  if (delta > 0) {
    ArrowIcon = ArrowUp
    arrowColor = isPositive
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400'
  } else if (delta < 0) {
    ArrowIcon = ArrowDown
    arrowColor = isPositive
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-white/40 dark:bg-neutral-700/20 border border-white/30 dark:border-white/5">
      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
        {row.label}
      </span>
      <span className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">
        {formattedValue}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        <ArrowIcon className={`h-3.5 w-3.5 ${arrowColor}`} />
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pillClasses}`}>
          {percentText}
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
          {absoluteText}
        </span>
      </div>
    </div>
  )
}

export function MonthComparison({
  currentMetrics,
  previousMetrics,
  currentLabel,
  previousLabel,
}: MonthComparisonProps) {
  return (
    <AnimatedSection animation="fade-up">
      <div className="bg-white/60 backdrop-blur-lg border border-white/20 dark:bg-neutral-800/50 dark:border-white/5 rounded-lg p-6">
        {/* Header */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Monatsvergleich
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {currentLabel} vs. {previousLabel}
          </p>
        </div>

        {/* Content */}
        {previousMetrics === null ? (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Keine Vergleichsdaten fur den Vormonat verfugbar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ComparisonRow
              row={{
                label: 'Bruttoumsatz',
                currentValue: currentMetrics.totalRevenue,
                previousValue: previousMetrics.totalRevenue,
                format: 'currency',
                invertDelta: false,
              }}
            />
            <ComparisonRow
              row={{
                label: 'Nettoumsatz',
                currentValue: currentMetrics.totalNetRevenue,
                previousValue: previousMetrics.totalNetRevenue,
                format: 'currency',
                invertDelta: false,
              }}
            />
            <ComparisonRow
              row={{
                label: 'Sitzungen',
                currentValue: currentMetrics.totalSessions,
                previousValue: previousMetrics.totalSessions,
                format: 'integer',
                invertDelta: false,
                unit: 'Sitzungen',
              }}
            />
            <ComparisonRow
              row={{
                label: 'Ausgaben',
                currentValue: currentMetrics.totalExpenses,
                previousValue: previousMetrics.totalExpenses,
                format: 'currency',
                invertDelta: true,
              }}
            />
            <ComparisonRow
              row={{
                label: 'Nettoeinkommen',
                currentValue: currentMetrics.netIncome,
                previousValue: previousMetrics.netIncome,
                format: 'currency',
                invertDelta: false,
              }}
            />
            <ComparisonRow
              row={{
                label: 'Durchschn. Sitzungspreis',
                currentValue: currentMetrics.averageSessionPrice,
                previousValue: previousMetrics.averageSessionPrice,
                format: 'currency',
                invertDelta: false,
              }}
            />
          </div>
        )}
      </div>
    </AnimatedSection>
  )
}
