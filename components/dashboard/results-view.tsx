'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { TherapyType } from '@/lib/types'
import { MonthSelector } from './month-selector'
import { MergedResultsTable } from './merged-results-table'
import { ResultsMetricsCards } from './results-metrics-cards'
import { ResultsImportDialog } from './results-import-dialog'
import { Button } from '@/components/ui/button'
import { Upload, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { getMonthsWithData, getMonthlyResultsWithTherapies } from '@/lib/actions/monthly-results'
import { getMonthlyPlansWithTherapies } from '@/lib/actions/monthly-plans'
import { getMonthlyMetrics } from '@/lib/actions/dashboard'

interface ResultsViewProps {
  therapies: TherapyType[]
}

export function ResultsView({ therapies }: ResultsViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get current month in YYYY-MM format
  const currentMonth = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }, [])

  // Get month from URL params, or use current month as default
  const initialMonth = searchParams.get('month') || currentMonth
  const [selectedMonth, setSelectedMonth] = useState(initialMonth)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [enteredCount, setEnteredCount] = useState(0)

  // Fetch months that have data
  useEffect(() => {
    getMonthsWithData().then(setAvailableMonths).catch(() => {})
  }, [refreshTrigger])

  // Count how many therapies have data entered for current month
  useEffect(() => {
    const countEntered = async () => {
      const results = await getMonthlyResultsWithTherapies(selectedMonth)
      setEnteredCount(results?.length || 0)
    }
    countEntered()
  }, [selectedMonth, refreshTrigger])

  // Listen for FAB action event
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === 'import-results') {
        setIsImportDialogOpen(true)
      }
    }
    window.addEventListener('fab-action', handler)
    return () => window.removeEventListener('fab-action', handler)
  }, [])

  // Update URL params when month changes
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth)
    // Update URL without triggering a page reload
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', newMonth)
    router.push(`/dashboard/ergebnisse?${params.toString()}`)
  }

  // Handle import completion - navigate to first imported month
  const handleImportComplete = (importedMonths?: string[]) => {
    setIsImportDialogOpen(false)
    // Navigate to the first imported month so user sees their data
    if (importedMonths && importedMonths.length > 0) {
      handleMonthChange(importedMonths[0])
    }
    // Trigger grid refresh by incrementing a counter
    setRefreshTrigger(prev => prev + 1)
  }

  const [mergedData, setMergedData] = useState<any[]>([])
  const [profitability, setProfitability] = useState<number | null>(null)

  // Load merged data and profit
  useEffect(() => {
    const loadMergedData = async () => {
      // Fetch profit from dashboard metrics
      const monthMetrics = await getMonthlyMetrics(selectedMonth)
      setProfitability(monthMetrics?.profitability ?? null)

      const plans = await getMonthlyPlansWithTherapies(selectedMonth)
      const filtered = plans.filter(p => p.planned_sessions > 0)

      const enriched = filtered.map(plan => {
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

      setMergedData(enriched)
    }

    loadMergedData()
  }, [selectedMonth, refreshTrigger])

  // Calculate metrics from merged data
  const metrics = useMemo(() => {
    const totalPlanned = mergedData.reduce((sum, r) => sum + r.planned_sessions, 0)
    const totalActual = mergedData.reduce((sum, r) => sum + (r.actual_sessions || 0), 0)
    const totalPlannedRevenue = mergedData.reduce((sum, r) => sum + r.planned_revenue, 0)
    const totalActualRevenue = mergedData.reduce((sum, r) => sum + r.actual_revenue, 0)

    const overallAchievement = totalPlanned > 0
      ? Math.round((totalActual / totalPlanned) * 100)
      : (totalActual > 0 ? 100 : 0)

    const therapiesWithData = mergedData.filter(r => r.actual_sessions && r.actual_sessions > 0).length

    return {
      totalPlanned,
      totalActual,
      overallAchievement,
      totalVariance: totalActual - totalPlanned,
      totalVariancePercent: totalPlanned > 0
        ? Math.round(((totalActual - totalPlanned) / totalPlanned) * 100)
        : 0,
      totalPlannedRevenue,
      totalActualRevenue,
      therapiesWithData,
      profitability
    }
  }, [mergedData, profitability])

  const hasAnyData = enteredCount > 0
  const allDataEntered = enteredCount === therapies.length && therapies.length > 0
  const progressPercent = therapies.length > 0 ? (enteredCount / therapies.length) * 100 : 0

  return (
    <div className="space-y-8">
      {/* Header + Month Selector */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Monatliche Ergebnisse erfassen
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Geben Sie Ihre tatsächlichen Therapiesitzungen und Umsätze ein
          </p>
        </div>

        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          availableMonths={availableMonths}
        />
      </div>

      {therapies.length === 0 && (
        <div className="bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-800 p-6">
          <h3 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">
            Erste Schritte
          </h3>
          <p className="text-accent-800 dark:text-accent-200 text-sm mb-3">
            Sie müssen zuerst Therapiearten erstellen, bevor Sie Ihre Ergebnisse erfassen können.
          </p>
          <Link
            href="/dashboard/therapien"
            className="inline-flex items-center gap-2 text-accent-600 dark:text-accent-400 hover:underline font-medium"
          >
            Zu Therapiearten
            <span>→</span>
          </Link>
        </div>
      )}

      {/* Results Comparison Section (only show if data exists) */}
      {hasAnyData && (
        <div className="space-y-8 border-t border-neutral-200 dark:border-neutral-800 pt-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                Monatliche Ergebnisse
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                Erfassen und vergleichen Sie Ihre tatsächlichen Ergebnisse
              </p>
            </div>
            <Button
              onClick={() => setIsImportDialogOpen(true)}
              className="gap-2"
              variant="outline"
            >
              <Upload className="h-4 w-4" />
              Importieren
            </Button>
          </div>

          {/* Key Metrics */}
          <ResultsMetricsCards
            totalPlanned={metrics.totalPlanned}
            totalActual={metrics.totalActual}
            overallAchievement={metrics.overallAchievement}
            totalVariance={metrics.totalVariance}
            totalVariancePercent={metrics.totalVariancePercent}
            totalPlannedRevenue={metrics.totalPlannedRevenue}
            totalActualRevenue={metrics.totalActualRevenue}
            therapiesWithData={metrics.therapiesWithData}
            totalTherapies={therapies.length}
            profitability={metrics.profitability}
          />

          {/* Merged Comparison Table */}
          <MergedResultsTable
            therapies={therapies}
            month={selectedMonth}
            onDataChange={() => setRefreshTrigger(prev => prev + 1)}
            key={`merged-${refreshTrigger}`}
          />
        </div>
      )}

      {/* Next Steps / CTA Section */}
      {allDataEntered && (
        <div className="bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-800 p-6">
          <div className="flex items-start gap-4">
            <TrendingUp className="h-6 w-6 text-accent-600 dark:text-accent-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-accent-900 dark:text-accent-100 mb-1">
                  Bereit für detaillierte Analysen?
                </h3>
                <p className="text-sm text-accent-800 dark:text-accent-200">
                  Sehen Sie umfassende Kennzahlen, Trends und Finanzübersichten in den Geschäftsberichten.
                </p>
              </div>
              <Link
                href="/dashboard/berichte"
                className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Zu Geschäftsberichten
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      <ResultsImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}
