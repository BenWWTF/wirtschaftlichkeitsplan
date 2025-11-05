import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import {
  getMonthlyMetricsRange,
  getTherapyMetrics,
  getDashboardSummary
} from '@/lib/actions/dashboard'
import { ReportsView } from '@/components/dashboard/reports-view'

export const metadata = {
  title: 'Geschäftsberichte - Wirtschaftlichkeitsplan',
  description: 'Detaillierte Geschäftsberichte und Analysen'
}

export default async function BerichtePage() {
  // Check authentication
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  // Get date range for last 12 months
  const now = new Date()
  const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const startMonth = startDate.toISOString().slice(0, 7)
  const endMonth = endDate.toISOString().slice(0, 7)

  // Load dashboard data
  const monthlyData = await getMonthlyMetricsRange(startMonth, endMonth)
  const therapyMetrics = await getTherapyMetrics()
  const summary = await getDashboardSummary()

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ReportsView
          monthlyData={monthlyData}
          therapyMetrics={therapyMetrics}
          summary={summary}
        />
      </div>
    </main>
  )
}
