'use client'

import { useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { TherapyType } from '@/lib/types'
import { MonthSelector } from './month-selector'
import { ResultsGrid } from './results-grid'
import { ResultsImportDialog } from './results-import-dialog'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import Link from 'next/link'

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

  // Update URL params when month changes
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth)
    // Update URL without triggering a page reload
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', newMonth)
    router.push(`/dashboard/ergebnisse?${params.toString()}`)
  }

  // Handle import completion
  const handleImportComplete = () => {
    setIsImportDialogOpen(false)
    // Trigger grid refresh by incrementing a counter
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          onClick={() => setIsImportDialogOpen(true)}
          className="gap-2"
          variant="default"
        >
          <Upload className="h-4 w-4" />
          Ergebnisse importieren
        </Button>
      </div>

      {/* Month Selector */}
      <MonthSelector
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
      />

      {/* Info Box */}
      {therapies.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Erste Schritte
          </h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
            Sie müssen zuerst Therapiearten erstellen, bevor Sie Ihre Ergebnisse vergleichen können.
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

      {/* Results Grid */}
      <ResultsGrid
        therapies={therapies}
        month={selectedMonth}
        key={refreshTrigger}
      />

      {/* Import Dialog */}
      <ResultsImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}
