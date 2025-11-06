import { getTherapies } from '@/lib/actions/therapies'
import { TherapyList } from '@/components/dashboard/therapy-list'

export const metadata = {
  title: 'Therapiearten - Wirtschaftlichkeitsplan',
  description: 'Verwalten Sie Ihre Therapiearten und Preise'
}

export default async function TherapienPage() {
  // Load therapies
  const therapies = await getTherapies()

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <TherapyList initialTherapies={therapies} />
      </div>
    </main>
  )
}
