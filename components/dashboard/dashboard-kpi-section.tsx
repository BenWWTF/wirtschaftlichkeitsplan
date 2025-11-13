'use client'

import { useDashboardSummary } from '@/lib/hooks/useDashboardSummary'
import { useTherapies } from '@/lib/hooks/useTherapies'
import { useExpenses } from '@/lib/hooks/useExpenses'
import { formatEuro } from '@/lib/utils'
import { DollarSign, BarChart3, Users, Receipt } from 'lucide-react'

/**
 * Client-side KPI section that uses SWR caching to reduce duplicate requests
 * When multiple components request the same data within the deduplication window,
 * only the first one triggers a network call. Others get cache hits.
 */
export function DashboardKPISection() {
  const { summary, isLoading: summaryLoading } = useDashboardSummary()
  const { therapies, isLoading: therapiesLoading } = useTherapies()
  const { expenses, isLoading: expensesLoading } = useExpenses()

  // Determine status styling
  const statusColor =
    summary?.break_even_status === 'surplus'
      ? 'text-green-600 dark:text-green-400'
      : summary?.break_even_status === 'breakeven'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400'

  const statusBg =
    summary?.break_even_status === 'surplus'
      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      : summary?.break_even_status === 'breakeven'
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'

  const statusLabel =
    summary?.break_even_status === 'surplus'
      ? 'Gewinn'
      : summary?.break_even_status === 'breakeven'
        ? 'Break-Even'
        : 'Verlust'

  // Skeleton loader for loading state
  if (summaryLoading || therapiesLoading || expensesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 animate-pulse"
          >
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mb-4"></div>
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-2"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-28"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
        <p className="text-red-700 dark:text-red-300">
          Fehler beim Laden der Dashboard-Daten
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Revenue */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Gesamtumsatz
          </p>
          <DollarSign className="h-5 w-5 text-blue-500" />
        </div>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {formatEuro(summary.total_revenue)}
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          {summary.total_sessions} Sitzungen
        </p>
      </div>

      {/* Net Income */}
      <div className={`${statusBg} rounded-lg border p-6`}>
        <div className="flex items-center justify-between mb-4">
          <p className={`text-sm ${statusColor}`}>
            {statusLabel}
          </p>
          <BarChart3 className={`h-5 w-5 ${statusColor}`} />
        </div>
        <p className={`text-3xl font-bold ${statusColor}`}>
          {formatEuro(summary.net_income)}
        </p>
        <p className={`text-sm mt-2 ${statusColor}`}>
          {summary.profitability_rate.toFixed(1)}% Marge
        </p>
      </div>

      {/* Therapy Types */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Therapiearten
          </p>
          <Users className="h-5 w-5 text-purple-500" />
        </div>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {therapies.length}
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          Aktive Angebote
        </p>
      </div>

      {/* Expenses */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Ausgaben
          </p>
          <Receipt className="h-5 w-5 text-red-500" />
        </div>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">
          {expenses.length}
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          Erfasste Ausgaben
        </p>
      </div>
    </div>
  )
}
