import Link from 'next/link'
import { BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-neutral-900 dark:text-white" />
            <h1 className="font-semibold text-neutral-900 dark:text-white">
              Ordi Finanzen
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

      {/* Hero Section - Full Screen */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-neutral-900 dark:text-white">
            Ordi Finanzen
          </h2>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-neutral-600 dark:text-neutral-400">
          <p>&copy; 2024 Ordi Finanzen. DSGVO-konform. EU-gehostet.</p>
        </div>
      </footer>
    </main>
  )
}
