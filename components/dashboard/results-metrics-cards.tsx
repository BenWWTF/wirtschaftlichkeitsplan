'use client'

import { CheckCircle2, TrendingUp, TrendingDown, Users, Banknote } from 'lucide-react'
import { formatEuro } from '@/lib/utils'

interface ResultsMetricsCardsProps {
  totalPlanned: number
  totalActual: number
  overallAchievement: number
  totalVariance: number
  totalVariancePercent: number
  totalPlannedRevenue: number
  totalActualRevenue: number
  therapiesWithData: number
  totalTherapies: number
  profitability: number | null
}

export function ResultsMetricsCards({
  totalPlanned,
  totalActual,
  overallAchievement,
  totalVariance,
  totalVariancePercent,
  totalPlannedRevenue,
  totalActualRevenue,
  therapiesWithData,
  totalTherapies,
  profitability
}: ResultsMetricsCardsProps) {
  const revenueVariance = totalActualRevenue - totalPlannedRevenue
  const dataProgressPercent = totalTherapies > 0 ? (therapiesWithData / totalTherapies) * 100 : 0
  const profit = profitability ?? 0

  // Determine achievement color
  let achievementColor = ''
  let achievementIcon = null
  if (overallAchievement >= 100) {
    achievementColor = 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    achievementIcon = <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
  } else if (overallAchievement >= 90) {
    achievementColor = 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    achievementIcon = <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
  } else {
    achievementColor = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    achievementIcon = <CheckCircle2 className="h-6 w-6 text-red-600 dark:text-red-400" />
  }

  // Determine revenue color
  const revenueColor = revenueVariance >= 0
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'

  const revenueIcon = revenueVariance >= 0
    ? <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
    : <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />

  // Determine profit color
  const profitColor = profit >= 0
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'

  const profitIcon = profit >= 0
    ? <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
    : <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Total Revenue Card */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Gesamtumsatz
            </p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {formatEuro(totalActualRevenue)}
            </p>
          </div>
          <Banknote className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Geplant: {formatEuro(totalPlannedRevenue)}
        </p>
      </div>

      {/* Gewinn (Profit) Card */}
      <div className={`rounded-lg border p-6 ${profitColor}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Gewinn
            </p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {formatEuro(profit)}
            </p>
          </div>
          {profitIcon}
        </div>
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Umsatz abzgl. aller Kosten
        </p>
      </div>

      {/* Achievement Rate Card */}
      <div className={`rounded-lg border p-6 ${achievementColor}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Erreichungsquote
            </p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {overallAchievement}%
            </p>
          </div>
          {achievementIcon}
        </div>
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {totalActual} von {totalPlanned} geplanten Sitzungen durchgeführt
        </p>
      </div>

      {/* Revenue Impact Card */}
      <div className={`rounded-lg border p-6 ${revenueColor}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Umsatzabweichung
            </p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {formatEuro(revenueVariance)}
            </p>
          </div>
          {revenueIcon}
        </div>
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {revenueVariance >= 0 ? '+' : ''}{totalVariancePercent}% Umsatz
        </p>
      </div>

      {/* Data Progress Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Dateneingabe
            </p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
              {therapiesWithData}/{totalTherapies}
            </p>
          </div>
          <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Therapien mit erfassten Daten
          </p>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${dataProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

    </div>
  )
}
