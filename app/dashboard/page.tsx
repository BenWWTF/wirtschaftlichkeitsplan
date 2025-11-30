import { Dashboard } from '@/components/dashboard'

export const metadata = {
  title: 'Dashboard - Wirtschaftlichkeitsplan',
  description: 'Ihr Financial Planning Dashboard'
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <Dashboard initialScope="month" initialComparisonMode="plan" />
        </div>
      </div>
    </main>
  )
}
