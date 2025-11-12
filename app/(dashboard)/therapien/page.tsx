import { getTherapies } from '@/lib/actions/therapies'
import { TherapyList } from '@/components/dashboard/therapy-list'

export const metadata = {
  title: 'Therapiearten | Wirtschaftlichkeitsplan',
  description: 'Verwalten Sie Ihre Therapiearten und deren Preise',
}

export default async function TherapienPage() {
  const therapies = await getTherapies()

  return (
    <main className="flex-1 space-y-8 p-8">
      <TherapyList therapies={therapies} />
    </main>
  )
}
