'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, ArrowRight } from 'lucide-react'
import { cn, formatEuro } from '@/lib/utils'

// German month names
const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

interface PlanWithTherapy {
  id: string
  therapy_type_id: string
  month: string
  planned_sessions: number
  actual_sessions: number | null
  notes: string | null
  therapy_types: {
    id: string
    name: string
    price_per_session: number
    variable_cost_per_session?: number
  } | null
}

type YearlyData = Record<string, PlanWithTherapy[]>

interface MonthSummary {
  monthKey: string
  monthIndex: number
  monthName: string
  totalSessions: number
  totalRevenue: number
  therapyTypeCount: number
  hasData: boolean
}

interface YearlyPlanningViewProps {
  initialYear: number
  initialData: YearlyData
}

export function YearlyPlanningView({ initialYear, initialData }: YearlyPlanningViewProps) {
  const router = useRouter()
  const [year, setYear] = useState(initialYear)
  const [yearlyData, setYearlyData] = useState<YearlyData>(initialData)
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)

  // Calculate per-month summaries
  const monthSummaries: MonthSummary[] = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`
      const plans = yearlyData[monthKey] || []

      const validPlans = plans.filter(p => p.therapy_types !== null)

      const totalSessions = validPlans.reduce(
        (sum, p) => sum + p.planned_sessions, 0
      )
      const totalRevenue = validPlans.reduce(
        (sum, p) => sum + p.planned_sessions * (p.therapy_types?.price_per_session ?? 0), 0
      )

      const uniqueTherapyTypes = new Set(validPlans.map(p => p.therapy_type_id))

      return {
        monthKey,
        monthIndex: i,
        monthName: MONTH_NAMES[i],
        totalSessions,
        totalRevenue,
        therapyTypeCount: uniqueTherapyTypes.size,
        hasData: validPlans.length > 0
      }
    })
  }, [yearlyData, year])

  // Calculate yearly totals
  const yearlyTotals = useMemo(() => {
    const totalSessions = monthSummaries.reduce((sum, m) => sum + m.totalSessions, 0)
    const totalRevenue = monthSummaries.reduce((sum, m) => sum + m.totalRevenue, 0)
    const monthsWithData = monthSummaries.filter(m => m.hasData).length
    const averageMonthlyRevenue = monthsWithData > 0 ? totalRevenue / monthsWithData : 0

    return {
      totalSessions,
      totalRevenue,
      averageMonthlyRevenue,
      monthsWithData
    }
  }, [monthSummaries])

  // Navigate year: reload page with new year param
  const handleYearChange = async (newYear: number) => {
    setYear(newYear)
    setIsLoading(true)

    // Fetch new year data client-side via server action import
    try {
      const { getMonthlyPlansWithTherapies } = await import('@/lib/actions/monthly-plans')

      const months = Array.from({ length: 12 }, (_, i) => {
        const month = String(i + 1).padStart(2, '0')
        return `${newYear}-${month}`
      })

      const results = await Promise.all(
        months.map(async (month) => {
          const plans = await getMonthlyPlansWithTherapies(month)
          return { month, plans: plans || [] }
        })
      )

      const newData: YearlyData = {}
      for (const { month, plans } of results) {
        newData[month] = plans
      }

      setYearlyData(newData)
    } catch (error) {
      console.error('Error fetching yearly plans:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToMonth = (monthKey: string) => {
    router.push(`/dashboard/planung?month=${monthKey}`)
  }

  // Find the max revenue month for relative bar sizing
  const maxMonthlyRevenue = useMemo(() => {
    return Math.max(...monthSummaries.map(m => m.totalRevenue), 1)
  }, [monthSummaries])

  return (
    <div className="space-y-8">
      {/* Year Selector */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => handleYearChange(year - 1)}
          disabled={isLoading}
          className={cn(
            'p-2 rounded-lg border border-neutral-200 dark:border-neutral-700',
            'bg-white dark:bg-neutral-800',
            'text-neutral-700 dark:text-neutral-300',
            'hover:bg-neutral-50 dark:hover:bg-neutral-700',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Vorheriges Jahr"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-[140px] justify-center">
          <Calendar className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          <span className="text-xl font-bold text-neutral-900 dark:text-white">
            {isLoading ? '...' : year}
          </span>
        </div>

        <button
          onClick={() => handleYearChange(year + 1)}
          disabled={isLoading}
          className={cn(
            'p-2 rounded-lg border border-neutral-200 dark:border-neutral-700',
            'bg-white dark:bg-neutral-800',
            'text-neutral-700 dark:text-neutral-300',
            'hover:bg-neutral-50 dark:hover:bg-neutral-700',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Nachstes Jahr"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          Daten werden geladen...
        </div>
      )}

      {/* 12-Month Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {monthSummaries.map((month) => (
            <button
              key={month.monthKey}
              onClick={() => navigateToMonth(month.monthKey)}
              className={cn(
                'group relative text-left rounded-lg border p-5',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950',
                month.hasData
                  ? 'border-green-200 dark:border-green-800 bg-white dark:bg-neutral-800 hover:shadow-md hover:border-green-300 dark:hover:border-green-700'
                  : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:shadow-sm hover:border-neutral-300 dark:hover:border-neutral-600'
              )}
            >
              {/* Status Indicator */}
              <div className="flex items-center justify-between mb-3">
                <h3 className={cn(
                  'text-base font-semibold',
                  month.hasData
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-neutral-500 dark:text-neutral-400'
                )}>
                  {month.monthName}
                </h3>
                <div className={cn(
                  'w-2.5 h-2.5 rounded-full flex-shrink-0',
                  month.hasData
                    ? 'bg-green-500 dark:bg-green-400'
                    : 'bg-neutral-300 dark:bg-neutral-600'
                )} />
              </div>

              {month.hasData ? (
                <div className="space-y-2">
                  {/* Sessions */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Sitzungen
                    </span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      {month.totalSessions}
                    </span>
                  </div>

                  {/* Revenue */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Umsatz
                    </span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatEuro(month.totalRevenue)}
                    </span>
                  </div>

                  {/* Therapy Types */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Therapiearten
                    </span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      {month.therapyTypeCount}
                    </span>
                  </div>

                  {/* Revenue Bar (relative to max month) */}
                  <div className="mt-3 pt-2">
                    <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${(month.totalRevenue / maxMonthlyRevenue) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-3 text-center">
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">
                    Keine Planung vorhanden
                  </p>
                </div>
              )}

              {/* Hover arrow */}
              <ArrowRight className={cn(
                'absolute top-5 right-4 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity',
                month.hasData
                  ? 'text-green-500 dark:text-green-400'
                  : 'text-neutral-400 dark:text-neutral-500'
              )} />
            </button>
          ))}
        </div>
      )}

      {/* Yearly Summary */}
      {!isLoading && (
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              Jahresübersicht {year}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Sessions */}
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                Geplante Sitzungen (gesamt)
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {yearlyTotals.totalSessions > 0 ? yearlyTotals.totalSessions : '---'}
              </p>
            </div>

            {/* Total Revenue */}
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                Geplanter Umsatz (gesamt)
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {yearlyTotals.totalRevenue > 0 ? formatEuro(yearlyTotals.totalRevenue) : '---'}
              </p>
            </div>

            {/* Average Monthly Revenue */}
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                Durchschn. Monatsumsatz
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {yearlyTotals.averageMonthlyRevenue > 0
                  ? formatEuro(yearlyTotals.averageMonthlyRevenue)
                  : '---'}
              </p>
            </div>

            {/* Months With Data */}
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                Monate mit Planung
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {yearlyTotals.monthsWithData} / 12
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
