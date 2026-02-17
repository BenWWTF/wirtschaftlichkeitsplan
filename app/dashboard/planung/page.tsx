import { Suspense } from 'react'
import { getTherapies } from '@/lib/actions/therapies'
import { PlanningView } from '@/components/dashboard/planning-view'
import { RelatedPages } from '@/components/dashboard/related-pages'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Monatliche Planung - Ordi Pro',
  description: 'Planen Sie Ihre monatlichen Therapiesitzungen'
}

export default async function PlanungPage() {
  // Load therapies
  const therapies = await getTherapies()

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Monatliche Planung</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Planen Sie Ihre monatlichen Therapiesitzungen und Umsatzziele</p>
        </div>
        <Suspense fallback={<div className="text-center py-12">Lädt...</div>}>
          <PlanningView therapies={therapies} />
        </Suspense>
        <RelatedPages currentPage="/dashboard/planung" />
      </div>
    </main>
  )
}
