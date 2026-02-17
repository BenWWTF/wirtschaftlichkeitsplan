'use client'

import { Target, TrendingUp, Calendar } from 'lucide-react'
import { AnimatedSection } from '@/components/ui/animated-section'
import { AnimatedBar } from '@/components/ui/animated-bar'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import type { MonthlySnapshot } from '@/lib/metrics/historical-metrics'

interface AnnualGoalProgressProps {
  annualGoal: number
  currentYearNetRevenue: number
  monthsElapsed: number
  historicalData?: MonthlySnapshot[]
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function AnimatedEuro({ value, className }: { value: number; className?: string }) {
  const animated = useAnimatedNumber(value, { duration: 1000, decimals: 0 })
  return <span className={`tabular-nums ${className ?? ''}`}>{formatEuro(Math.round(animated))}</span>
}

export function AnnualGoalProgress({
  annualGoal,
  currentYearNetRevenue,
  monthsElapsed,
  historicalData,
}: AnnualGoalProgressProps) {
  if (!annualGoal || annualGoal <= 0) return null

  const percentage = Math.min((currentYearNetRevenue / annualGoal) * 100, 100)
  const remaining = Math.max(annualGoal - currentYearNetRevenue, 0)
  const monthsLeft = 12 - monthsElapsed

  // Project year-end based on current pace
  const monthlyAverage = monthsElapsed > 0 ? currentYearNetRevenue / monthsElapsed : 0
  const projectedYearEnd = monthlyAverage * 12
  const onTrack = projectedYearEnd >= annualGoal

  // Required monthly average to hit goal
  const requiredMonthly = monthsLeft > 0 ? remaining / monthsLeft : 0

  return (
    <AnimatedSection animation="fade-up" delay={100}>
      <div className="bg-white/60 backdrop-blur-lg border border-white/20 dark:bg-neutral-800/50 dark:backdrop-blur-lg dark:border-white/5 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent-500" />
            <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
              Jahresziel {new Date().getFullYear()}
            </h3>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
              onTrack
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            {onTrack ? 'Auf Kurs' : 'Unter Plan'}
          </span>
        </div>

        {/* Main progress */}
        <div className="space-y-2 mb-4">
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              <AnimatedEuro value={currentYearNetRevenue} />
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              von {formatEuro(annualGoal)}
            </p>
          </div>
          <AnimatedBar
            percentage={percentage}
            colorClass={onTrack ? 'bg-accent-500' : 'bg-amber-500'}
            trackClass="bg-neutral-200 dark:bg-neutral-700"
            heightClass="h-3"
            duration={1500}
            delay={200}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
            {percentage.toFixed(1)}% erreicht
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Verbleibend
            </p>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white tabular-nums">
              {formatEuro(remaining)}
            </p>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
              in {monthsLeft} {monthsLeft === 1 ? 'Monat' : 'Monaten'}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Prognose Jahresende
            </p>
            <p className={`text-sm font-semibold tabular-nums ${
              onTrack
                ? 'text-green-600 dark:text-green-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              {formatEuro(projectedYearEnd)}
            </p>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
              bei {formatEuro(monthlyAverage)}/Monat
            </p>
          </div>
        </div>

        {/* Required monthly if behind */}
        {!onTrack && monthsLeft > 0 && (
          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Benötigt: <span className="font-semibold tabular-nums">{formatEuro(requiredMonthly)}</span>/Monat um das Ziel zu erreichen
            </p>
          </div>
        )}
      </div>
    </AnimatedSection>
  )
}
