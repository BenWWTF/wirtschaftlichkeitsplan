import { getUnifiedMetrics } from '@/lib/metrics/unified-metrics'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ForecastTab } from '@/components/dashboard/analyse/forecast-tab'
import { RelatedPages } from '@/components/dashboard/related-pages'

export const metadata = {
  title: 'Prognose - Wirtschaftlichkeitsplan',
  description: '6-Monats-Prognose mit angepassbaren Parametern für Ihre Praxis'
}

export default async function AnalysePage() {
  // Load unified metrics for analysis
  const metrics = await getUnifiedMetrics({
    scope: 'month',
    compareMode: 'plan',
    date: new Date()
  })

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <section className="border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-8">
          <Breadcrumb
            items={[
              { label: 'Prognose', href: '/dashboard/analyse' }
            ]}
            className="text-xs sm:text-sm"
          />
        </section>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Prognose
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            6-Monats-Gewinnprognose mit angepassbaren Parametern und Therapieanalyse
          </p>
        </div>

        {/* Content */}
        <ForecastTab metrics={metrics} />
        <RelatedPages currentPage="/dashboard/analyse" />
      </div>
    </main>
  )
}
