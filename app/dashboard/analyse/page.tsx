import { getBreakEvenAnalysis } from '@/lib/actions/analysis'
import { AnalysisView } from '@/components/dashboard/analysis-view'

export const metadata = {
  title: 'Break-Even Analyse - Wirtschaftlichkeitsplan',
  description: 'Analysieren Sie Ihre Rentabilität und Break-Even-Punkt'
}

export const revalidate = 3600  // Revalidate every hour (break-even rarely changes)

export default async function AnalysePage() {
  // Load break-even data
  const breakEvenData = await getBreakEvenAnalysis()

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnalysisView therapies={breakEvenData} />
      </div>
    </main>
  )
}
