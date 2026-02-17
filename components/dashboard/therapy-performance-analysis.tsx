'use client'

import { AlertCircle, TrendingUp } from 'lucide-react'
import { AchievementBadge } from './achievement-badge'
import type { ResultsRow } from '@/lib/actions/monthly-results'

interface TherapyPerformanceAnalysisProps {
  results: ResultsRow[]
}

export function TherapyPerformanceAnalysis({ results }: TherapyPerformanceAnalysisProps) {
  // Filter to therapies with actual sessions entered
  const therapiesWithData = results.filter(r => r.actual_sessions && r.actual_sessions > 0)

  if (therapiesWithData.length === 0) {
    return null
  }

  // Sort by achievement descending
  const sorted = [...therapiesWithData].sort((a, b) => b.achievement - a.achievement)

  // Best performers: top 3 with achievement >= 100%
  const bestPerformers = sorted.filter(r => r.achievement >= 100).slice(0, 3)

  // Needs attention: all with achievement < 90%
  const needsAttention = sorted.filter(r => r.achievement < 90)

  // If nothing to show, don't render
  if (bestPerformers.length === 0 && needsAttention.length === 0) {
    return null
  }

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
          Therapie-Performance
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Übersicht nach Erreichungsquote
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Performers */}
        {bestPerformers.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                Best Performers
              </h4>
            </div>
            <div className="space-y-3">
              {bestPerformers.map(therapy => (
                <div key={therapy.id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {therapy.therapy_name}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {therapy.actual_sessions} / {therapy.planned_sessions} Sitzungen
                    </p>
                  </div>
                  <AchievementBadge achievement={therapy.achievement} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h4 className="font-semibold text-red-900 dark:text-red-100">
                Benötigt Aufmerksamkeit
              </h4>
            </div>
            <div className="space-y-3">
              {needsAttention.map(therapy => (
                <div key={therapy.id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {therapy.therapy_name}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {therapy.actual_sessions} / {therapy.planned_sessions} Sitzungen
                    </p>
                  </div>
                  <AchievementBadge achievement={therapy.achievement} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for "Needs Attention" if none found */}
        {needsAttention.length === 0 && bestPerformers.length > 0 && (
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 flex items-center justify-center">
            <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              Alle Therapien erfüllen die Ziele zu mindestens 90% ✓
            </p>
          </div>
        )}

        {/* Empty state for "Best Performers" if none found */}
        {bestPerformers.length === 0 && needsAttention.length > 0 && (
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 flex items-center justify-center">
            <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              Noch keine Therapien mit 100%+ Erreichung
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
