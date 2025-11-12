import { getExpenses } from '@/lib/actions/expenses'
import { ExpenseList } from '@/components/dashboard/expense-list'

export const metadata = {
  title: 'Ausgaben - Wirtschaftlichkeitsplan',
  description: 'Verwalten Sie Ihre Betriebsausgaben'
}

export default async function AusgabenPage() {
  const expenses = await getExpenses()

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ExpenseList expenses={expenses} />
      </div>
    </main>
  )
}
