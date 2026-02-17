'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { TherapyType } from '@/lib/types'
import { MonthSelector } from './month-selector'
import { PlannerGrid } from './planner-grid'
import { Button } from '@/components/ui/button'
import { Plus, Copy, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { copyMonthlyPlansAction, copyMonthPlanAction } from '@/lib/actions/monthly-plans'

const MONTHS_DE = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

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
  const [isCopyingSingle, setIsCopyingSingle] = useState(false)
  const [showCopyPopover, setShowCopyPopover] = useState(false)
  const [copyTargetYear, setCopyTargetYear] = useState(() => {
    const [y] = initialMonth.split('-').map(Number)
    return y
  })
  const [copyTargetMonthNum, setCopyTargetMonthNum] = useState<number | null>(null)
  const copyPopoverRef = useRef<HTMLDivElement>(null)

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (copyPopoverRef.current && !copyPopoverRef.current.contains(e.target as Node)) {
        setShowCopyPopover(false)
        setCopyTargetMonthNum(null)
      }
    }
    if (showCopyPopover) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCopyPopover])

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
        toast.success('Plan wurde auf die naechsten Monate kopiert!')
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten')
      console.error(error)
    } finally {
      setIsCopying(false)
    }
  }

  const handleCopyToSpecificMonth = async () => {
    if (copyTargetMonthNum === null) return

    const targetMonth = `${copyTargetYear}-${String(copyTargetMonthNum).padStart(2, '0')}`

    try {
      setIsCopyingSingle(true)
      const result = await copyMonthPlanAction({
        sourceMonth: selectedMonth,
        targetMonth: targetMonth
      })

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Plan nach ${MONTHS_DE[copyTargetMonthNum - 1]} ${copyTargetYear} kopiert!`)
        setShowCopyPopover(false)
        setCopyTargetMonthNum(null)
        // Navigate to the target month
        handleMonthChange(targetMonth)
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten')
      console.error(error)
    } finally {
      setIsCopyingSingle(false)
    }
  }

  const formatSelectedMonth = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number)
    return `${MONTHS_DE[m - 1]} ${y}`
  }

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleCopyToNextMonths}
            disabled={isCopying}
            className="gap-2 w-full sm:w-auto"
            variant="outline"
          >
            <Copy className="h-4 w-4" />
            {isCopying ? 'Kopiere...' : 'Auf alle Monate anwenden'}
          </Button>

          {/* Copy to specific month */}
          <div className="relative" ref={copyPopoverRef}>
            <Button
              onClick={() => {
                setShowCopyPopover(!showCopyPopover)
                setCopyTargetMonthNum(null)
                // Initialize year from selected month
                const [y] = selectedMonth.split('-').map(Number)
                setCopyTargetYear(y)
              }}
              className="gap-2 w-full sm:w-auto"
              variant="outline"
            >
              <Copy className="h-4 w-4" />
              Monat kopieren
            </Button>

            {showCopyPopover && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-4 w-80">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Plan von {formatSelectedMonth(selectedMonth)} kopieren nach:
                  </p>
                  <button
                    onClick={() => {
                      setShowCopyPopover(false)
                      setCopyTargetMonthNum(null)
                    }}
                    className="p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded"
                    aria-label="Schliessen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Year Navigation */}
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCopyTargetYear(copyTargetYear - 1)}
                    className="h-8 w-8"
                    aria-label="Vorheriges Jahr"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-base font-semibold text-neutral-900 dark:text-white">
                    {copyTargetYear}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCopyTargetYear(copyTargetYear + 1)}
                    className="h-8 w-8"
                    aria-label="Naechstes Jahr"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Month Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1
                    const monthStr = `${copyTargetYear}-${String(month).padStart(2, '0')}`
                    const isSource = monthStr === selectedMonth
                    const isSelected = copyTargetMonthNum === month

                    return (
                      <button
                        key={month}
                        onClick={() => {
                          if (!isSource) setCopyTargetMonthNum(month)
                        }}
                        disabled={isSource}
                        className={`py-2 px-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-accent-600 text-white shadow-md'
                            : isSource
                              ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                              : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600'
                        }`}
                        title={isSource ? 'Quellmonat' : MONTHS_DE[month - 1]}
                      >
                        {MONTHS_DE[month - 1].slice(0, 3)}
                      </button>
                    )
                  })}
                </div>

                {/* Confirm Button */}
                <Button
                  onClick={handleCopyToSpecificMonth}
                  disabled={copyTargetMonthNum === null || isCopyingSingle}
                  className="w-full gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {isCopyingSingle
                    ? 'Kopiere...'
                    : copyTargetMonthNum !== null
                      ? `Plan kopieren nach ${MONTHS_DE[copyTargetMonthNum - 1]} ${copyTargetYear}`
                      : 'Zielmonat waehlen'
                  }
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <MonthSelector
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
      />

      {/* Info Box */}
      {therapies.length === 0 && (
        <div className="bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-800 p-6">
          <h3 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">
            💡 Erste Schritte
          </h3>
          <p className="text-accent-800 dark:text-accent-200 text-sm mb-3">
            Sie müssen zuerst Therapiearten erstellen, bevor Sie Ihre Planung beginnen können.
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
