'use client'

import { useState, useMemo } from 'react'
import type { TherapyType } from '@/lib/types'
import { useMonthlyPlans } from '@/lib/hooks/useMonthlyPlans'
import { PlannerCard } from './planner-card'
import { Button } from '@/components/ui/button'
import { Plus, AlertCircle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { formatEuro } from '@/lib/utils'

interface PlannerGridProps {
  therapies: TherapyType[]
  month: string
  onAddTherapy?: () => void
}

interface TherapyTypeBasic {
  id: string
  name: string
  price_per_session: number
  variable_cost_per_session: number
}

interface MonthlyPlanWithTherapy {
  id: string
  therapy_type_id: string
  month: string
  planned_sessions: number
  actual_sessions: number | null
  notes: string | null
  therapy_types: TherapyTypeBasic | null
}

export function PlannerGrid({
  therapies,
  month,
  onAddTherapy
}: PlannerGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Use SWR hook for automatic caching and deduplication
  // Monthly plans are cached per month for 60 seconds
  const { plans: basePlans, isLoading, mutate } = useMonthlyPlans(month)

  // Wrapper for mutate to match expected function signature
  const refreshPlans = async () => {
    await mutate()
  }

  // Enrich plans with therapy details from the passed therapies
  const plans = useMemo(() => {
    return (basePlans || []).map(plan => {
      const therapy = therapies.find(t => t.id === plan.therapy_type_id)
      return {
        ...plan,
        therapy_types: therapy ? {
          id: therapy.id,
          name: therapy.name,
          price_per_session: therapy.price_per_session,
          variable_cost_per_session: therapy.variable_cost_per_session,
        } : null
      }
    }) as MonthlyPlanWithTherapy[]
  }, [basePlans, therapies])

  // Calculate total planned revenue and margin
  const totals = useMemo(() => {
    return plans.reduce(
      (acc, plan) => {
        // Safely handle cases where therapy_types might be null or undefined
        if (!plan.therapy_types) {
          return acc
        }

        const plannedRevenue = plan.planned_sessions * plan.therapy_types.price_per_session
        const plannedMargin = plan.planned_sessions * (plan.therapy_types.price_per_session - plan.therapy_types.variable_cost_per_session)

        return {
          sessions: acc.sessions + plan.planned_sessions,
          revenue: acc.revenue + plannedRevenue,
          margin: acc.margin + plannedMargin
        }
      },
      { sessions: 0, revenue: 0, margin: 0 }
    )
  }, [plans])

  if (therapies.length === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Keine Therapiearten vorhanden"
        description="Erstellen Sie zuerst Therapiearten, um Ihre monatliche Planung zu beginnen."
        action={{
          label: 'Erste Therapieart erstellen',
          onClick: onAddTherapy || (() => {})
        }}
      />
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
            onRefresh={refreshPlans}
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
              {totals.sessions > 0 ? totals.sessions : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Geschätzter Umsatz
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totals.revenue > 0 ? formatEuro(totals.revenue) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
