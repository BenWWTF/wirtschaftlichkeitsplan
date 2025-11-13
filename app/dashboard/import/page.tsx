import { LatidoImportForm } from '@/components/dashboard/latido-import-form'

export const metadata = {
  title: 'Latido Import - Wirtschaftlichkeitsplan',
  description: 'Import invoices from your Latido billing system'
}

export default function ImportPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Import Latido Invoices
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Upload your Latido billing export to reconcile with your therapy sessions
          </p>
        </div>

        <LatidoImportForm />
      </div>
    </main>
  )
}
