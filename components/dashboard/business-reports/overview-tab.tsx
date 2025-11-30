'use client'

import type { MonthlyMetrics, TherapyMetrics, DashboardSummary } from '@/lib/actions/dashboard'
import { BusinessDashboard } from '../business-dashboard'

interface OverviewTabProps {
  monthlyData: MonthlyMetrics[]
  therapyMetrics: TherapyMetrics[]
  summary: DashboardSummary
}

export function OverviewTab({
  monthlyData,
  therapyMetrics,
  summary
}: OverviewTabProps) {
  return (
    <div className="py-6">
      <BusinessDashboard
        monthlyData={monthlyData}
        therapyMetrics={therapyMetrics}
        summary={summary}
      />
    </div>
  )
}
