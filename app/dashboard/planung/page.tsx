import { PlanningView } from '@/components/dashboard/planning-view'

export const metadata = {
  title: 'Monatliche Planung - Wirtschaftlichkeitsplan',
  description: 'Planen Sie Ihre monatlichen Therapiesitzungen'
}

export default function PlanungPage() {
  // Therapies are now fetched client-side by PlanningView using SWR hook
  // This provides automatic caching and deduplication
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PlanningView />
      </div>
    </main>
  )
}
