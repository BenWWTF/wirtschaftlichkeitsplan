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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchEditMode, setBatchEditMode] = useState(false)
  const [batchEditValue, setBatchEditValue] = useState('')
  const [batchEditType, setBatchEditType] = useState<'set' | 'add' | 'subtract'>('set')

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

  // Handle batch editing
  const handleBatchApply = async () => {
    if (selectedIds.size === 0 || !batchEditValue) {
      toast.error('Bitte wählen Sie Therapien und geben Sie einen Wert ein')
      return
    }

    const numValue = parseInt(batchEditValue) || 0
    let updated = 0

    for (const resultId of selectedIds) {
      const result = results.find(r => r.id === resultId)
      if (!result) continue

      let newValue = numValue
      if (batchEditType === 'add') {
        newValue = (result.actual_sessions || 0) + numValue
      } else if (batchEditType === 'subtract') {
        newValue = Math.max(0, (result.actual_sessions || 0) - numValue)
      }

      try {
        await updateActualSessions(result.therapy_type_id, month, newValue)
        updated++
      } catch (error) {
        console.error('Error updating:', error)
      }
    }

    if (updated > 0) {
      toast.success(`${updated} Therapien aktualisiert`)
      setSelectedIds(new Set())
      setBatchEditMode(false)
      setBatchEditValue('')
      // Reload data
      const plans = await getMonthlyPlansWithTherapies(month)
      const filtered = plans.filter(p => p.planned_sessions > 0)
      const enriched: ResultsRow[] = filtered.map(plan => {
        const actual = plan.actual_sessions || 0
        const planned = plan.planned_sessions
        const variance = actual - planned
        const variancePercent = planned > 0 ? Math.round((variance / planned) * 100) : 0
        const achievement = planned > 0 ? Math.round((actual / planned) * 100) : (actual > 0 ? 100 : 0)
        const pricePerSession = plan.therapy_types?.price_per_session || 0
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
          planned_revenue: planned * pricePerSession,
          actual_revenue: actual * pricePerSession
        }
      })
      setResults(enriched)
      onDataChange?.()
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(results.map(r => r.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
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
      {/* Batch Edit Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-900 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-neutral-900 dark:text-white">
                {selectedIds.size} Therapie{selectedIds.size > 1 ? 'n' : ''} ausgewählt
              </p>
              <button
                onClick={() => {
                  setSelectedIds(new Set())
                  setBatchEditMode(false)
                }}
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                Abbrechen
              </button>
            </div>

            {!batchEditMode ? (
              <button
                onClick={() => setBatchEditMode(true)}
                className="w-full px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded font-medium text-sm transition-colors"
              >
                Bearbeiten
              </button>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={batchEditType}
                    onChange={(e) => setBatchEditType(e.target.value as any)}
                    className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                  >
                    <option value="set">Setzen auf</option>
                    <option value="add">Hinzufügen</option>
                    <option value="subtract">Subtrahieren</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={batchEditValue}
                    onChange={(e) => setBatchEditValue(e.target.value)}
                    placeholder="Wert"
                    className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={handleBatchApply}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium text-sm transition-colors"
                  >
                    Anwenden
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden md:block bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
            <tr>
              <th className="px-4 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === results.length && results.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-neutral-300 text-accent-600 cursor-pointer"
                />
              </th>
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
              <EditableResultsTableRow
                key={result.id}
                result={result}
                onSave={handleSaveActualSessions}
                onDelete={handleDeleteActualSessions}
                isSelected={selectedIds.has(result.id)}
                onSelect={() => toggleSelect(result.id)}
              />
            ))}
          </tbody>

          {/* Footer with totals */}
          <tfoot className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
            <tr>
              <td className="px-4 py-4" />
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
