import { Suspense } from 'react'
import { getMonthlyPlansWithTherapies } from '@/lib/actions/monthly-plans'
import { YearlyPlanningView } from '@/components/dashboard/yearly-planning-view'
import { RelatedPages } from '@/components/dashboard/related-pages'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Jahrliche Planung - Ordi Pro',
  description: 'Jahresübersicht aller monatlichen Planungen mit Gesamtauswertung'
}

/**
 * Fetch all 12 months of plans for a given year.
 * Returns a map: { "YYYY-MM": planData[] }
 */
async function fetchYearlyPlans(year: number) {
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0')
    return `${year}-${month}`
  })

  const results = await Promise.all(
    months.map(async (month) => {
      const plans = await getMonthlyPlansWithTherapies(month)
      return { month, plans: plans || [] }
    })
  )

  const yearlyData: Record<string, Array<{
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
  }>> = {}

  for (const { month, plans } of results) {
    yearlyData[month] = plans
  }

  return yearlyData
}

export default async function JaehrlichePlanungPage() {
  const currentYear = new Date().getFullYear()
  const yearlyData = await fetchYearlyPlans(currentYear)

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Jahrliche Planung
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Jahresübersicht aller monatlichen Planungen mit Gesamtauswertung und Trends
          </p>
        </div>
        <Suspense fallback={<div className="text-center py-12">Ladt...</div>}>
          <YearlyPlanningView
            initialYear={currentYear}
            initialData={yearlyData}
          />
        </Suspense>
        <RelatedPages currentPage="/dashboard/planung-jaehrlich" />
      </div>
    </main>
  )
}
