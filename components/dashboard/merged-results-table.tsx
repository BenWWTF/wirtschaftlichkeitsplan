'use client'

import { useState, useEffect } from 'react'
import type { TherapyType } from '@/lib/types'
import { EditableResultsTableRow } from './editable-results-table-row'
import { EditableResultsCardRow } from './editable-results-card-row'
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { getMonthlyPlansWithTherapies } from '@/lib/actions/monthly-plans'
import { updateActualSessions, resetActualSessions } from '@/lib/actions/monthly-results'
import type { ResultsRow } from '@/lib/actions/monthly-results'
import { formatEuro } from '@/lib/utils'
import { toast } from 'sonner'

interface MergedResultsTableProps {
  therapies: TherapyType[]
  month: string
  onDataChange?: () => void
}

export function MergedResultsTable({
  therapies,
  month,
  onDataChange
}: MergedResultsTableProps) {
  const [results, setResults] = useState<ResultsRow[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load monthly plans and convert to results format
  useEffect(() => {
    const loadResults = async () => {
      setIsLoading(true)
      try {
        // Fetch plans with therapy details
        const plans = await getMonthlyPlansWithTherapies(month)

        // Filter to only therapies with planned sessions
        const filtered = plans.filter(p => p.planned_sessions > 0)

        // Calculate metrics for each row
        const enriched: ResultsRow[] = filtered.map(plan => {
          const actual = plan.actual_sessions || 0
          const planned = plan.planned_sessions
          const variance = actual - planned
          const variancePercent = planned > 0
            ? Math.round((variance / planned) * 100)
            : 0
          const achievement = planned > 0
            ? Math.round((actual / planned) * 100)
            : (actual > 0 ? 100 : 0)
          const pricePerSession = plan.therapy_types?.price_per_session || 0
          const planned_revenue = planned * pricePerSession
          const actual_revenue = actual * pricePerSession

          return {
            id: plan.id,
            therapy_type_id: plan.therapy_type_id,
            therapy_name: plan.therapy_types?.name || 'Gelöschte Therapieart',
            price_per_session: pricePerSession,
            planned_sessions: planned,
            actual_sessions: actual,
            variance,
            variancePercent,
            achievement,
            planned_revenue,
            actual_revenue
          }
        })

        setResults(enriched)
      } catch (error) {
        console.error('Error loading merged results:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    loadResults()
  }, [month])

  // Calculate aggregate metrics
  const totalPlanned = results.reduce((sum, r) => sum + r.planned_sessions, 0)
  const totalActual = results.reduce((sum, r) => sum + (r.actual_sessions || 0), 0)
  const totalPlannedRevenue = results.reduce((sum, r) => sum + r.planned_revenue, 0)
  const totalActualRevenue = results.reduce((sum, r) => sum + r.actual_revenue, 0)

  const overallAchievement = totalPlanned > 0
    ? Math.round((totalActual / totalPlanned) * 100)
    : (totalActual > 0 ? 100 : 0)

  const totalVariance = totalActual - totalPlanned
  const totalVariancePercent = totalPlanned > 0
    ? Math.round(((totalActual - totalPlanned) / totalPlanned) * 100)
    : 0

  // Handle saving actual sessions
  const handleSaveActualSessions = async (therapyTypeId: string, actualSessions: number) => {
    try {
      const result = await updateActualSessions(therapyTypeId, month, actualSessions)
      if (result.error) {
        toast.error(result.error || 'Fehler beim Speichern')
        return
      }

      // Reload data after successful save
      const plans = await getMonthlyPlansWithTherapies(month)
      const filtered = plans.filter(p => p.planned_sessions > 0)

      const enriched: ResultsRow[] = filtered.map(plan => {
        const actual = plan.actual_sessions || 0
        const planned = plan.planned_sessions
        const variance = actual - planned
        const variancePercent = planned > 0
          ? Math.round((variance / planned) * 100)
          : 0
        const achievement = planned > 0
          ? Math.round((actual / planned) * 100)
          : (actual > 0 ? 100 : 0)
        const pricePerSession = plan.therapy_types?.price_per_session || 0
        const planned_revenue = planned * pricePerSession
        const actual_revenue = actual * pricePerSession

        return {
          id: plan.id,
          therapy_type_id: plan.therapy_type_id,
          therapy_name: plan.therapy_types?.name || 'Gelöschte Therapieart',
          price_per_session: pricePerSession,
          planned_sessions: planned,
          actual_sessions: actual,
          variance,
          variancePercent,
          achievement,
          planned_revenue,
          actual_revenue
        }
      })

      setResults(enriched)
      onDataChange?.()
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
      const plans = await getMonthlyPlansWithTherapies(month)
      const filtered = plans.filter(p => p.planned_sessions > 0)

      const enriched: ResultsRow[] = filtered.map(plan => {
        const actual = plan.actual_sessions || 0
        const planned = plan.planned_sessions
        const variance = actual - planned
        const variancePercent = planned > 0
          ? Math.round((variance / planned) * 100)
          : 0
        const achievement = planned > 0
          ? Math.round((actual / planned) * 100)
          : (actual > 0 ? 100 : 0)
        const pricePerSession = plan.therapy_types?.price_per_session || 0
        const planned_revenue = planned * pricePerSession
        const actual_revenue = actual * pricePerSession

        return {
          id: plan.id,
          therapy_type_id: plan.therapy_type_id,
          therapy_name: plan.therapy_types?.name || 'Gelöschte Therapieart',
          price_per_session: pricePerSession,
          planned_sessions: planned,
          actual_sessions: actual,
          variance,
          variancePercent,
          achievement,
          planned_revenue,
          actual_revenue
        }
      })

      setResults(enriched)
      onDataChange?.()
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
            Keine geplanten Sitzungen für diesen Monat
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Erstellen Sie zuerst einen Plan in der Planungsansicht, um Ergebnisse erfassen zu können
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
                Preis
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                Geplant
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                Tatsächlich ✏️
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
              <td className="px-6 py-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
                -
              </td>
              <td className="px-6 py-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                {totalPlanned}
              </td>
              <td className="px-6 py-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                {totalActual}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  {totalVariance >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-semibold ${
                    totalVariance >= 0
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    {totalVariance >= 0 ? '+' : ''}{totalVariance} ({totalVariancePercent >= 0 ? '+' : ''}{totalVariancePercent}%)
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                  overallAchievement >= 100
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : overallAchievement >= 90
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {overallAchievement}%
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
