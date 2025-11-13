import { ExpenseList } from '@/components/dashboard/expense-list'

export const metadata = {
  title: 'Ausgaben - Wirtschaftlichkeitsplan',
  description: 'Verwalten Sie Ihre Betriebsausgaben'
}

export default function AusgabenPage() {
  // Expenses are now fetched client-side by ExpenseList using SWR hook
  // This provides automatic caching and deduplication
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ExpenseList />
      </div>
    </main>
  )
}
