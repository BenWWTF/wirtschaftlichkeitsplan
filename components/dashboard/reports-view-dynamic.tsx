'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { MonthlyMetrics, TherapyMetrics, DashboardSummary } from '@/lib/actions/dashboard'

const ReportsView = dynamic(() => import('./reports-view').then(mod => ({ default: mod.ReportsView })), {
  loading: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    </div>
  ),
  ssr: true
})

interface ReportsViewDynamicProps {
  monthlyData: MonthlyMetrics[]
  therapyMetrics: TherapyMetrics[]
  summary: DashboardSummary
}

export function ReportsViewDynamic({
  monthlyData,
  therapyMetrics,
  summary
}: ReportsViewDynamicProps) {
  return (
    <ReportsView
      monthlyData={monthlyData}
      therapyMetrics={therapyMetrics}
      summary={summary}
    />
  )
}
