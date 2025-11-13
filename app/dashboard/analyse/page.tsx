import dynamic from 'next/dynamic'
import { getBreakEvenAnalysis } from '@/lib/actions/analysis'

const AnalysisView = dynamic(() => import('@/components/dashboard/analysis-view').then(mod => ({ default: mod.AnalysisView })), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="h-8 w-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading analysis...</p>
      </div>
    </div>
  ),
  ssr: true,
})

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
