import Link from 'next/link'
import { getDashboardSummary, getMonthlyMetrics } from '@/lib/actions/dashboard'
import { getTherapies } from '@/lib/actions/therapies'
import { getExpenses } from '@/lib/actions/expenses'
import { formatEuro } from '@/lib/utils'
import { DollarSign, BarChart3, Users, Receipt, Settings, TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Dashboard - Wirtschaftlichkeitsplan',
  description: 'Ihr Financial Planning Dashboard'
}

export default async function DashboardPage() {
  // Fetch current data
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
  const summary = await getDashboardSummary()
  const monthlyMetrics = await getMonthlyMetrics(currentMonth)
  const therapies = await getTherapies()
  const expenses = await getExpenses()

  const statusColor =
    summary.break_even_status === 'surplus'
      ? 'text-green-600 dark:text-green-400'
      : summary.break_even_status === 'breakeven'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400'

  const statusBg =
    summary.break_even_status === 'surplus'
      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      : summary.break_even_status === 'breakeven'
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'

  const statusLabel =
    summary.break_even_status === 'surplus'
      ? 'Gewinn'
      : summary.break_even_status === 'breakeven'
        ? 'Break-Even'
        : 'Verlust'

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                Wirtschaftlichkeitsplan Dashboard
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                Übersicht Ihrer Praxis-Finanzen
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              ← Zurück
            </Link>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Gesamtumsatz
                </p>
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                {formatEuro(summary.total_revenue)}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                {summary.total_sessions} Sitzungen
              </p>
            </div>

            {/* Net Income */}
            <div className={`${statusBg} rounded-lg border p-6`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`text-sm ${statusColor}`}>
                  {statusLabel}
                </p>
                <BarChart3 className={`h-5 w-5 ${statusColor}`} />
              </div>
              <p className={`text-3xl font-bold ${statusColor}`}>
                {formatEuro(summary.net_income)}
              </p>
              <p className={`text-sm mt-2 ${statusColor}`}>
                {summary.profitability_rate.toFixed(1)}% Marge
              </p>
            </div>

            {/* Therapy Types */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Therapiearten
                </p>
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                {therapies.length}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                Aktive Angebote
              </p>
            </div>

            {/* Expenses */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Ausgaben
                </p>
                <Receipt className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                {expenses.length}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                Erfasste Ausgaben
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              Schnellzugriff
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/dashboard/therapien" className="group">
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all">
                  <div className="text-3xl mb-3">🏥</div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Therapiearten
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Verwalten Sie Ihre Therapiearten
                  </p>
                </div>
              </Link>

              <Link href="/dashboard/planung" className="group">
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all">
                  <div className="text-3xl mb-3">📅</div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Monatliche Planung
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Planen Sie Ihre Sitzungen
                  </p>
                </div>
              </Link>

              <Link href="/dashboard/ausgaben" className="group">
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all">
                  <div className="text-3xl mb-3">💳</div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Ausgaben
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Erfassen Sie Betriebsausgaben
                  </p>
                </div>
              </Link>

              <Link href="/dashboard/analyse" className="group">
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all">
                  <div className="text-3xl mb-3">💰</div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Break-Even Analyse
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Analysieren Sie Ihre Rentabilität
                  </p>
                </div>
              </Link>

              <Link href="/dashboard/berichte" className="group">
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Berichte
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Finanzielle Übersichten
                  </p>
                </div>
              </Link>

              <Link href="/dashboard/einstellungen" className="group">
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all">
                  <div className="text-3xl mb-3">⚙️</div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Einstellungen
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Praxis-Konfiguration
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
              📈 Entwicklungsfortschritt
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Phase 3: Therapiearten Management</span>
                  <span className="font-medium text-green-600 dark:text-green-400">✅ Fertig</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Phase 4: Monatliche Planung</span>
                  <span className="font-medium text-green-600 dark:text-green-400">✅ Fertig</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Phase 5: Break-Even Analyse</span>
                  <span className="font-medium text-green-600 dark:text-green-400">✅ Fertig</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Phase 6: Ausgaben & Einstellungen</span>
                  <span className="font-medium text-green-600 dark:text-green-400">✅ Fertig</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Erste Schritte
            </h3>
            <ol className="text-blue-800 dark:text-blue-200 text-sm space-y-2 mb-3">
              <li>
                <strong>1. Einstellungen konfigurieren:</strong> Legen Sie Ihre Praxis-Details und Fixkosten fest
              </li>
              <li>
                <strong>2. Therapiearten erstellen:</strong> Definieren Sie Ihre Therapiearten und Preise
              </li>
              <li>
                <strong>3. Ausgaben erfassen:</strong> Tragen Sie Ihre Betriebsausgaben ein
              </li>
              <li>
                <strong>4. Monatliche Planung:</strong> Planen Sie Ihre Sitzungen für den aktuellen Monat
              </li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  )
}
