'use client'

import { useState, useEffect, useMemo } from 'react'
import type { TherapyType } from '@/lib/types'
import { PlannerTableRow } from './planner-table-row'
import { PlannerCardRow } from './planner-card-row'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { getMonthlyPlansWithTherapies } from '@/lib/actions/monthly-plans'
import { formatEuro } from '@/lib/utils'
import { calculatePaymentFee, calculateNetRevenue, SUMUP_FEE_RATE } from '@/lib/calculations/payment-fees'

interface PlannerGridProps {
  therapies: TherapyType[]
  month: string
  onAddTherapy?: () => void
}

interface MonthlyPlanWithTherapy {
  id: string
  therapy_type_id: string
  month: string
  planned_sessions: number
  actual_sessions: number | null
  notes: string | null
  therapy_types: TherapyType
}

export function PlannerGrid({
  therapies,
  month,
  onAddTherapy
}: PlannerGridProps) {
  const [plans, setPlans] = useState<MonthlyPlanWithTherapy[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load all monthly plans for the selected month
  useEffect(() => {
    const loadPlans = async () => {
      setIsLoading(true)
      try {
        const data = await getMonthlyPlansWithTherapies(month)
        setPlans(data || [])
      } catch (error) {
        console.error('Error loading monthly plans:', error)
        setPlans([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPlans()
  }, [month])

  // Refresh plans after a save or delete
  const refreshPlans = async () => {
    const data = await getMonthlyPlansWithTherapies(month)
    setPlans(data || [])
  }

  // Calculate total planned revenue with fee breakdown
  const totals = useMemo(() => {
    const result = plans.reduce(
      (acc, plan) => {
        // Safely handle cases where therapy_types might be null or undefined
        if (!plan.therapy_types) {
          return acc
        }

        const grossRevenue = plan.planned_sessions * plan.therapy_types.price_per_session

        return {
          sessions: acc.sessions + plan.planned_sessions,
          grossRevenue: acc.grossRevenue + grossRevenue
        }
      },
      { sessions: 0, grossRevenue: 0 }
    )

    // Calculate fees and net revenue from totals
    const paymentFees = calculatePaymentFee(result.grossRevenue)
    const netRevenue = calculateNetRevenue(result.grossRevenue)
    const feePercentage = (SUMUP_FEE_RATE * 100).toFixed(2)

    return {
      ...result,
      paymentFees,
      netRevenue,
      feePercentage
    }
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
      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden md:block bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                Therapieart
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                Preis/Sitzung
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                Geplante Sitzungen
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-900 dark:text-white">
                Geplanter Umsatz
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                Aktion
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {therapies.map((therapy) => {
              const plan = plans.find((p) => p.therapy_type_id === therapy.id)
              const plannedRevenue = (plan?.planned_sessions || 0) * therapy.price_per_session

              return (
                <PlannerTableRow
                  key={therapy.id}
                  therapy={therapy}
                  plan={plan}
                  month={month}
                  plannedRevenue={plannedRevenue}
                  onRefresh={refreshPlans}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (hidden on desktop) */}
      <div className="md:hidden space-y-3">
        {therapies.map((therapy) => {
          const plan = plans.find((p) => p.therapy_type_id === therapy.id)
          const plannedRevenue = (plan?.planned_sessions || 0) * therapy.price_per_session

          return (
            <PlannerCardRow
              key={therapy.id}
              therapy={therapy}
              plan={plan}
              month={month}
              plannedRevenue={plannedRevenue}
              onRefresh={refreshPlans}
            />
          )
        })}
      </div>

      {/* Summary with Fee Breakdown */}
      <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 text-sm sm:text-base">
          Zusammenfassung für {month}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Therapiearten
            </p>
            <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
              {therapies.length}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Geplante Sitzungen
            </p>
            <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
              {totals.sessions > 0 ? totals.sessions : '---'}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Bruttoumsatz
            </p>
            <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
              {totals.grossRevenue > 0 ? formatEuro(totals.grossRevenue) : '---'}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Zahlungsgebühren ({totals.feePercentage}%)
            </p>
            <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
              {totals.paymentFees > 0 ? `-${formatEuro(totals.paymentFees)}` : '---'}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Nettoumsatz
            </p>
            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {totals.netRevenue > 0 ? formatEuro(totals.netRevenue) : '---'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
