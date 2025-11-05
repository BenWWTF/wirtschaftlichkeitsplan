'use client'

import { useState, useMemo } from 'react'
import type { TherapyType } from '@/lib/types'
import { PlannerCard } from './planner-card'
import { Button } from '@/components/ui/button'
import { Plus, AlertCircle } from 'lucide-react'

interface PlannerGridProps {
  therapies: TherapyType[]
  month: string
  onAddTherapy?: () => void
}

export function PlannerGrid({
  therapies,
  month,
  onAddTherapy
}: PlannerGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Calculate total planned revenue and margin
  const totals = useMemo(() => {
    return therapies.reduce(
      (acc, therapy) => {
        // Note: actual plan data would come from database
        // This is placeholder - real data loads in planner-card
        return {
          revenue: acc.revenue,
          margin: acc.margin
        }
      },
      { revenue: 0, margin: 0 }
    )
  }, [therapies])

  if (therapies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center">
        <AlertCircle className="h-12 w-12 text-neutral-400 dark:text-neutral-600 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          Keine Therapiearten vorhanden
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-sm mb-4">
          Erstellen Sie zuerst Therapiearten, um Ihre monatliche Planung zu beginnen.
        </p>
        <Button onClick={onAddTherapy} className="gap-2">
          <Plus className="h-4 w-4" />
          Erste Therapieart erstellen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {therapies.map((therapy) => (
          <PlannerCard
            key={therapy.id}
            therapy={therapy}
            month={month}
            isExpanded={expandedId === therapy.id}
            onToggleExpand={() =>
              setExpandedId(expandedId === therapy.id ? null : therapy.id)
            }
          />
        ))}
      </div>

      {/* Summary */}
      <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
          Zusammenfassung für {month}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Therapiearten
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {therapies.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Geplante Sitzungen
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              —
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Geschätzter Umsatz
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              —
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
