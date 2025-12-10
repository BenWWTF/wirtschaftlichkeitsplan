'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTherapies } from '@/lib/hooks/useTherapies'
import { useMonthlyPlans } from '@/lib/hooks/useMonthlyPlans'
import { copyPlansFromPreviousMonthAction } from '@/lib/actions/monthly-plans'
import { getMonthlyCapacity } from '@/lib/actions/monthly-capacity'
import { MonthSelector } from './month-selector'
import { CapacityEditor } from './capacity-editor'
import { PlannerGrid } from './planner-grid'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Lightbulb, ClipboardList, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PlanningViewProps {
  therapies?: any[] // Optional for backwards compatibility during transition
  maxSessionsPerWeek?: number
}

/**
 * Capacity Indicator Component
 * Displays how many therapy sessions are planned for a month
 * and the remaining capacity based on max sessions per week
 */
function CapacityIndicator({
  month,
  maxSessionsPerWeek,
  customCapacity
}: {
  month: string
  maxSessionsPerWeek: number
  customCapacity?: number | null
}) {
  const { plans } = useMonthlyPlans(month)

  // Calculate total planned sessions for the month
  const totalPlannedSessions = useMemo(() => {
    return (plans || []).reduce((sum, plan) => sum + (plan.planned_sessions || 0), 0)
  }, [plans])

  // Calculate weeks in the selected month
  const weeksInMonth = useMemo(() => {
    const [year, monthNum] = month.split('-')
    const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate()
    // Round to nearest week for capacity planning accuracy
    // e.g., January (31 days) = 4.43 weeks ≈ 4 weeks
    return Math.round(daysInMonth / 7)
  }, [month])

  // Use custom capacity if available, otherwise use default
  const effectiveCapacityPerWeek = customCapacity || maxSessionsPerWeek
  const maxCapacity = weeksInMonth * effectiveCapacityPerWeek
  const remaining = maxCapacity - totalPlannedSessions
  const usagePercent = Math.round((totalPlannedSessions / maxCapacity) * 100)
  const isOverCapacity = totalPlannedSessions > maxCapacity

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Kapazitätsauslastung
        </h3>
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {totalPlannedSessions} / {maxCapacity} Sitzungen
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full transition-all rounded-full ${
            isOverCapacity
              ? 'bg-red-500'
              : usagePercent > 80
                ? 'bg-amber-500'
                : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(usagePercent, 100)}%` }}
        />
      </div>

      {/* Status */}
      <div className="flex items-start gap-2">
        {isOverCapacity ? (
          <div className="flex items-start gap-2 flex-1">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="text-red-700 dark:text-red-200 font-medium">
                Kapazität überschritten
              </p>
              <p className="text-red-600 dark:text-red-300">
                {totalPlannedSessions - maxCapacity} Sitzungen über Limit ({usagePercent}%)
              </p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-neutral-600 dark:text-neutral-400 flex-1">
            {remaining === 0 ? (
              <p>Kapazität vollständig ausgelastet</p>
            ) : (
              <p>
                {remaining} Sitzungen noch verfügbar ({100 - usagePercent}% frei)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function PlanningView({ therapies: initialTherapies, maxSessionsPerWeek = 30 }: PlanningViewProps) {
  // Use SWR hook for automatic caching and deduplication
  const { therapies: cachedTherapies, isLoading } = useTherapies()
  const therapies = cachedTherapies || initialTherapies || []
  // Get current month in YYYY-MM format
  const currentMonth = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }, [])

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [customCapacity, setCustomCapacity] = useState<number | null>(null)
  const [capacityRefresh, setCapacityRefresh] = useState(0)

  // Load selected month from localStorage on mount, or use current month
  useEffect(() => {
    const savedMonth = typeof window !== 'undefined' ? localStorage.getItem('planning-selected-month') : null
    setSelectedMonth(savedMonth || currentMonth)
  }, [currentMonth])

  // Load custom capacity whenever month changes
  useEffect(() => {
    if (!selectedMonth) return

    const loadCapacity = async () => {
      const capacity = await getMonthlyCapacity(selectedMonth)
      setCustomCapacity(capacity)
    }

    loadCapacity()
  }, [selectedMonth, capacityRefresh])

  // Save selected month to localStorage whenever it changes
  const handleMonthChange = async (month: string) => {
    setSelectedMonth(month)
    if (typeof window !== 'undefined') {
      localStorage.setItem('planning-selected-month', month)
    }

    // Try to copy plans from previous month if no plans exist for this month
    try {
      const result = await copyPlansFromPreviousMonthAction(month)
      if (result.success && result.copied) {
        toast.success(`${result.copied} Planungen aus Vormonat übernommen`)
      }
    } catch (error) {
      // Silently fail - this is optional functionality
      console.error('Could not auto-copy previous month plans:', error)
    }
  }

  // Handler for capacity editor to refresh capacity data
  const handleCapacityChange = () => {
    setCapacityRefresh(prev => prev + 1)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Monatliche Planung
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Planen Sie Ihre Therapiesitzungen für jeden Monat
          </p>
        </div>
      </div>

      {/* Month Selector and Capacity */}
      {selectedMonth && (
        <div className="space-y-4">
          <MonthSelector
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
          />

          {/* Capacity Section - Editor and Indicator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Capacity Editor */}
            <CapacityEditor
              month={selectedMonth}
              defaultCapacity={maxSessionsPerWeek}
              onCapacityChange={handleCapacityChange}
            />

            {/* Capacity Indicator */}
            <CapacityIndicator
              month={selectedMonth}
              maxSessionsPerWeek={maxSessionsPerWeek}
              customCapacity={customCapacity}
            />
          </div>
        </div>
      )}

      {/* Info Box */}
      {therapies.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Erste Schritte
            </h3>
          </div>
          <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
            Sie müssen zuerst Therapiearten erstellen, bevor Sie Ihre Planung beginnen können.
          </p>
          <Link
            href="/dashboard/therapien"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Zu Therapiearten
            <span>→</span>
          </Link>
        </div>
      )}

      {/* Planner Grid */}
      {selectedMonth && (
        <PlannerGrid
          therapies={therapies}
          month={selectedMonth}
          onAddTherapy={() => {
            // Navigation handled via link in info box
          }}
        />
      )}

      {/* Quick Help */}
      <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            Wie funktioniert die Planung?
          </h3>
        </div>
        <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          <li className="flex gap-3">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">1.</span>
            <span>
              Wählen Sie einen Monat aus oder navigieren Sie mit den Pfeilen
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">2.</span>
            <span>Klicken Sie auf eine Therapieart um die Details zu öffnen</span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">3.</span>
            <span>Geben Sie die geplante Anzahl der Sitzungen ein</span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">4.</span>
            <span>
              Speichern Sie Ihre Planung, um den Umsatz und Deckungsbeitrag zu sehen
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">5.</span>
            <span>
              Am Monatsende können Sie die tatsächliche Anzahl der Sitzungen eintragen
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
