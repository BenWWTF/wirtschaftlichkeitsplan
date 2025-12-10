import { PlanningView } from '@/components/dashboard/planning-view'
import { getPracticeSettings } from '@/lib/actions/settings'

export const metadata = {
  title: 'Monatliche Planung - Wirtschaftlichkeitsplan',
  description: 'Planen Sie Ihre monatlichen Therapiesitzungen'
}

export default async function PlanungPage() {
  // Fetch practice settings to get max_sessions_per_week
  const settings = await getPracticeSettings()

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PlanningView maxSessionsPerWeek={settings?.max_sessions_per_week || 30} />
      </div>
    </main>
  )
}
