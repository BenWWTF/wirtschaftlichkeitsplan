import { Suspense } from 'react'
import { getTherapies } from '@/lib/actions/therapies'
import { ResultsView } from '@/components/dashboard/results-view'
import { RelatedPages } from '@/components/dashboard/related-pages'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Ergebnisse & Analyse - Ordi Pro',
  description: 'Erfassen Sie Ihre Ergebnisse und sehen Sie detaillierte Analysen'
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
