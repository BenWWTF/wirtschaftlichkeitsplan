'use client'

import type { ResultsRow } from '@/lib/actions/monthly-results'
import { formatEuro } from '@/lib/utils'
import { VarianceIndicator } from './variance-indicator'
import { AchievementBadge } from './achievement-badge'

interface ResultsCardRowProps {
  result: ResultsRow
}

export function ResultsCardRow({ result }: ResultsCardRowProps) {
  const { therapy_name, price_per_session, planned_sessions, actual_sessions, variance, variancePercent, achievement } = result

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-neutral-900 dark:text-white">
            {therapy_name}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {formatEuro(price_per_session)}/Sitzung
          </p>
        </div>
        <AchievementBadge achievement={achievement} size="sm" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Geplant</span>
          <span className="font-semibold text-neutral-900 dark:text-white">{planned_sessions}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Tatsächlich</span>
          <span className="font-semibold text-neutral-900 dark:text-white">{actual_sessions}</span>
        </div>

        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Abweichung</span>
          <VarianceIndicator variance={variance} variancePercent={variancePercent} achievement={achievement} size="sm" />
        </div>
      </div>
    </div>
  )
}
