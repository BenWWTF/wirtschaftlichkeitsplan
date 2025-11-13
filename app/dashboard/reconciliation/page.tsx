import { LatidoReconciliation } from '@/components/dashboard/latido-reconciliation'

export const metadata = {
  title: 'Latido Reconciliation - Wirtschaftlichkeitsplan',
  description: 'Reconcile Latido billing with your therapy sessions'
}

export default function ReconciliationPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reconciliation Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            View and reconcile Latido invoices against your therapy sessions
          </p>
        </div>

        <LatidoReconciliation />
      </div>
    </main>
  )
}
