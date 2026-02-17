'use client'

import { useState, useEffect, useMemo } from 'react'
import type { TherapyType } from '@/lib/types'
import { EditableResultsTableRow } from './editable-results-table-row'
import { EditableResultsCardRow } from './editable-results-card-row'
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { getMonthlyResultsWithTherapies, calculateMonthlyMetrics, updateActualSessions, resetActualSessions } from '@/lib/actions/monthly-results'
import { formatEuro } from '@/lib/utils'
import type { ResultsRow } from '@/lib/actions/monthly-results'
import { toast } from 'sonner'

interface ResultsGridProps {
  therapies: TherapyType[]
  month: string
}

export function ResultsGrid({
  therapies,
  month
}: ResultsGridProps) {
  const [results, setResults] = useState<ResultsRow[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load results for the selected month
  useEffect(() => {
    const loadResults = async () => {
      setIsLoading(true)
      try {
        const [resultsData, metricsData] = await Promise.all([
          getMonthlyResultsWithTherapies(month),
          calculateMonthlyMetrics(month)
        ])
        setResults(resultsData || [])
        setMetrics(metricsData)
      } catch (error) {
        console.error('Error loading results:', error)
        setResults([])
        setMetrics(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadResults()
  }, [month])

  // Handle saving actual sessions
  const handleSaveActualSessions = async (therapyTypeId: string, actualSessions: number) => {
    try {
      const result = await updateActualSessions(therapyTypeId, month, actualSessions)
      if (result.error) {
        toast.error(result.error || 'Fehler beim Speichern')
        return
      }

      // Reload data after successful save
      const [updatedResults, updatedMetrics] = await Promise.all([
        getMonthlyResultsWithTherapies(month),
        calculateMonthlyMetrics(month)
      ])
      setResults(updatedResults || [])
      setMetrics(updatedMetrics)

      toast.success('Sitzungen aktualisiert')
    } catch (error) {
      console.error('Error saving actual sessions:', error)
      toast.error('Fehler beim Speichern der Sitzungen')
    }
  }

  // Handle deleting/resetting actual sessions
  const handleDeleteActualSessions = async (therapyTypeId: string) => {
    try {
      const result = await resetActualSessions(therapyTypeId, month)
      if (result.error) {
        toast.error(result.error || 'Fehler beim Zurücksetzen')
        return
      }

      // Reload data
      const [updatedResults, updatedMetrics] = await Promise.all([
        getMonthlyResultsWithTherapies(month),
        calculateMonthlyMetrics(month)
      ])
      setResults(updatedResults || [])
      setMetrics(updatedMetrics)

      toast.success('Ergebnisse zurückgesetzt')
    } catch (error) {
      console.error('Error resetting actual sessions:', error)
      toast.error('Fehler beim Zurücksetzen der Ergebnisse')
    }
  }

  if (therapies.length === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Keine Therapiearten vorhanden"
        description="Erstellen Sie zuerst Therapiearten, um Ihre Ergebnisse zu vergleichen."
      />
    )
  }

  if (results.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-12">
        <div className="text-center">
          <p className="text-neutral-600 dark:text-neutral-400 mb-3">
            Keine Daten für diesen Monat verfügbar
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Importieren Sie Daten oder erstellen Sie manuell Einträge, um Ergebnisse zu sehen
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden md:block bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                Therapieart
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                Geplant
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                Tatsächlich
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                Abweichung
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                Erreichung
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {results.map((result) => (
              <EditableResultsTableRow key={result.id} result={result} onSave={handleSaveActualSessions} onDelete={handleDeleteActualSessions} />
            ))}
          </tbody>

          {/* Footer with totals */}
          <tfoot className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
            <tr>
              <td className="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-white">
                GESAMT
              </td>
              <td className="px-6 py-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                {metrics?.totalPlanned || 0}
              </td>
              <td className="px-6 py-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                {metrics?.totalActual || 0}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  {metrics?.totalVariance >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-semibold ${
                    metrics?.totalVariance >= 0
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    {metrics?.totalVariance >= 0 ? '+' : ''}{metrics?.totalVariance || 0} ({metrics?.totalVariancePercent || 0}%)
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                  metrics?.overallAchievement >= 100
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : metrics?.overallAchievement >= 90
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {metrics?.overallAchievement || 0}%
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile Card View (hidden on desktop) */}
      <div className="md:hidden space-y-3">
        {results.map((result) => (
          <EditableResultsCardRow key={result.id} result={result} onSave={handleSaveActualSessions} onDelete={handleDeleteActualSessions} />
        ))}
      </div>
    </div>
  )
}
