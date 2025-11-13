import Link from 'next/link'
import { BarChart3, Building, Calendar } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-neutral-900 dark:text-white" />
            <h1 className="font-semibold text-neutral-900 dark:text-white">
              Wirtschaftlichkeitsplan
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Zum Tool
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
          Finanzplanung für österreichische Arztpraxen
        </h2>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
          Verwalten Sie Therapiearten, planen Sie monatliche Sitzungen, und analysieren Sie Break-Even-Punkte – alles in einem intuitiven Dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Jetzt Starten – Kostenlos
          </Link>
          <Link
            href="#features"
            className="px-8 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Mehr erfahren
          </Link>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
            <Building className="h-8 w-8 text-neutral-900 dark:text-neutral-300 mb-4" />
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
              Therapiearten verwalten
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Erstellen Sie Therapiearten mit individuellen Preisen und variablen Kosten
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
            <Calendar className="h-8 w-8 text-neutral-900 dark:text-neutral-300 mb-4" />
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
              Monatliche Planung
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Planen Sie Sitzungen pro Therapieart und verfolgen Sie Umsatzprognosen
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
            <BarChart3 className="h-8 w-8 text-neutral-900 dark:text-neutral-300 mb-4" />
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
              Break-Even Analyse
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Berechnen Sie Ihre Break-Even-Punkte und analysieren Sie Rentabilität
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-neutral-600 dark:text-neutral-400">
          <p>&copy; 2024 Wirtschaftlichkeitsplan. DSGVO-konform. EU-gehostet.</p>
        </div>
      </footer>
    </main>
  )
}
