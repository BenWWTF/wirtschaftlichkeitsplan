import { Suspense } from 'react'
import { getTherapies } from '@/lib/actions/therapies'
import { ResultsView } from '@/components/dashboard/results-view'
import { RelatedPages } from '@/components/dashboard/related-pages'

export const metadata = {
  title: 'Monatliche Ergebnisse - Wirtschaftlichkeitsplan',
  description: 'Vergleichen Sie geplante und tatsächliche Therapiesitzungen'
}

export default async function ErgebnissePage() {
  // Load therapies
  const therapies = await getTherapies()

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<div className="text-center py-12">Lädt...</div>}>
          <ResultsView therapies={therapies} />
        </Suspense>
        <RelatedPages currentPage="/dashboard/ergebnisse" />
      </div>
    </main>
  )
}
