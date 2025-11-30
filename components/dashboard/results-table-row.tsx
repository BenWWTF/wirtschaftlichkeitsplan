'use client'

import type { ResultsRow } from '@/lib/actions/monthly-results'
import { formatEuro } from '@/lib/utils'
import { VarianceIndicator } from './variance-indicator'
import { AchievementBadge } from './achievement-badge'

interface ResultsTableRowProps {
  result: ResultsRow
}

export function ResultsTableRow({ result }: ResultsTableRowProps) {
  const { therapy_name, price_per_session, planned_sessions, actual_sessions, variance, variancePercent, achievement } = result

  return (
    <tr className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <p className="text-sm font-medium text-neutral-900 dark:text-white">
            {therapy_name}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {formatEuro(price_per_session)}/Sitzung
          </p>
        </div>
      </td>

      <td className="px-6 py-4 text-center">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
          {planned_sessions}
        </p>
      </td>

      <td className="px-6 py-4 text-center">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
          {actual_sessions}
        </p>
      </td>

      <td className="px-6 py-4 text-center">
        <VarianceIndicator variance={variance} variancePercent={variancePercent} achievement={achievement} size="md" />
      </td>

      <td className="px-6 py-4 text-center">
        <AchievementBadge achievement={achievement} size="md" />
      </td>
    </tr>
  )
}
