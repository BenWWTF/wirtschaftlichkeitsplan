'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { TherapyType } from '@/lib/types'
import { MonthSelector } from './month-selector'
import { PlannerGrid } from './planner-grid'
import { Button } from '@/components/ui/button'
import { Plus, Copy } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { copyMonthlyPlansAction } from '@/lib/actions/monthly-plans'

interface PlanningViewProps {
  therapies: TherapyType[]
}

export function PlanningView({ therapies }: PlanningViewProps) {
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
  const [isCopying, setIsCopying] = useState(false)

  // Update URL params when month changes
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth)
    // Update URL without triggering a page reload
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', newMonth)
    router.push(`/dashboard/planung?${params.toString()}`)
  }

  const handleCopyToNextMonths = async () => {
    try {
      setIsCopying(true)
      const result = await copyMonthlyPlansAction({
        fromMonth: selectedMonth,
        toMonths: 11 // Copy to next 11 months
      })

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Plan wurde auf die nächsten Monate kopiert!')
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten')
      console.error(error)
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          onClick={handleCopyToNextMonths}
          disabled={isCopying}
          className="gap-2"
          variant="outline"
        >
          <Copy className="h-4 w-4" />
          {isCopying ? 'Kopiere...' : 'Auf alle Monate anwenden'}
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
      <PlannerGrid
        therapies={therapies}
        month={selectedMonth}
        onAddTherapy={() => {
          // Navigation handled via link in info box
        }}
      />
    </div>
  )
}
