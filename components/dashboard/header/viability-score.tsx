/**
 * Viability Score Component
 * Displays overall practice health as a 0-100 score with visual indicator
 */

import { Activity } from 'lucide-react'
import type { ViabilityScore } from '@/lib/calculations'

interface ViabilityScorerProps {
  score: ViabilityScore
}

export function ViabilityScorer({ score }: ViabilityScorerProps) {
  const getScoreColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600'
      case 'caution':
        return 'text-amber-600'
      case 'healthy':
        return 'text-green-600'
      default:
        return 'text-neutral-600'
    }
  }

  const getScoreBg = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-950/20'
      case 'caution':
        return 'bg-amber-50 dark:bg-amber-950/20'
      case 'healthy':
        return 'bg-green-50 dark:bg-green-950/20'
      default:
        return 'bg-neutral-50 dark:bg-neutral-900'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'critical':
        return 'Critical'
      case 'caution':
        return 'Needs Attention'
      case 'healthy':
        return 'Healthy'
      default:
        return 'Unknown'
    }
  }

  const ringColor =
    score.status === 'critical'
      ? 'from-red-600'
      : score.status === 'caution'
        ? 'from-amber-600'
        : 'from-green-600'

  return (
    <div
      className={`${getScoreBg(score.status)} rounded-lg border border-neutral-200 dark:border-neutral-700 p-6`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Practice Viability
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-4xl font-bold ${getScoreColor(score.status)}`}
            >
              {Math.round(score.score)}
            </span>
            <span className="text-sm text-neutral-500">/100</span>
          </div>
        </div>

        {/* Score Ring */}
        <div className="relative h-24 w-24">
          <svg className="h-24 w-24 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-neutral-200 dark:text-neutral-700"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={`${(score.score / 100) * 283} 283`}
              className={`transition-all duration-500 ${getScoreColor(score.status)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity
              className={`h-8 w-8 ${getScoreColor(score.status)}`}
            />
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4 inline-block">
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
            score.status === 'critical'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
              : score.status === 'caution'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
          }`}
        >
          {score.status === 'critical' && '🔴'}
          {score.status === 'caution' && '🟡'}
          {score.status === 'healthy' && '🟢'}
          {getStatusLabel(score.status)}
        </span>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex justify-between mb-1">
            <span>Revenue Coverage</span>
            <span className="font-medium">{score.revenueRatio.toFixed(1)}x</span>
          </div>
          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.min(score.revenueRatio * 50, 100)}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex justify-between mb-1">
            <span>Therapy Utilization</span>
            <span className="font-medium">{score.therapyUtilization.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${score.therapyUtilization}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex justify-between mb-1">
            <span>Session Volume</span>
            <span className="font-medium">
              {score.sessionUtilization.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-300"
              style={{ width: `${score.sessionUtilization}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex justify-between mb-1">
            <span>Expense Management</span>
            <span className="font-medium">
              {score.expenseManagement.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${Math.min(score.expenseManagement, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
