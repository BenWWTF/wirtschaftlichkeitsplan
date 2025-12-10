import Link from 'next/link'
import { getDashboardSummary, getDashboardMetrics } from '@/lib/actions/dashboard'
import { DashboardKPISection } from '@/components/dashboard/dashboard-kpi-section'
import { TaxPlanningCardClient } from '@/components/dashboard/tax-planning-card-client'
import { ForecastKPISection } from '@/components/dashboard/forecast-kpi-section'
import { ResultsKPISection } from '@/components/dashboard/results-kpi-section'
import { HistoryChart } from '@/components/dashboard/history-chart'
import { DollarSign, BarChart3, Settings, TrendingUp, CheckCircle2, Wrench, Lightbulb, Building, Calendar, CreditCard, Download, LogOut } from 'lucide-react'

export const metadata = {
  title: 'Dashboard - Wirtschaftlichkeitsplan',
  description: 'Ihr Finanzplanungs-Dashboard'
}

export const revalidate = 300  // Revalidate every 5 minutes (dashboard KPIs change with data)

export default async function DashboardPage() {
  // Fetch new unified dashboard metrics (includes forecast, results, and 12-month history)
  const dashboardMetrics = await getDashboardMetrics()
  const summary = await getDashboardSummary()

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
              ← Zurück zur Startseite
            </Link>
          </div>

          {/* KPI Cards - Using SWR caching for deduplication */}
          <DashboardKPISection />

          {/* New Unified Metrics Dashboard */}
          {dashboardMetrics && (
            <>
              {/* Forecast Section */}
              <ForecastKPISection
                forecast={dashboardMetrics.forecast}
                monthYear={dashboardMetrics.month_year}
              />

              {/* Results Section */}
              <ResultsKPISection
                results={dashboardMetrics.results}
                totalExpenses={dashboardMetrics.total_expenses}
                monthYear={dashboardMetrics.month_year}
              />

              {/* 12-Month History Chart */}
              <HistoryChart history={dashboardMetrics.history_12_months} />
            </>
          )}

          {/* Tax Planning Section */}
          {summary && summary.total_revenue > 0 && (
            <TaxPlanningCardClient
              grossRevenue={summary.total_revenue}
              totalExpenses={summary.total_expenses}
              practiceType="wahlarzt"
            />
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              Schnellzugriffe
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/dashboard/therapien" className="group">
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all">
                  <Building className="h-8 w-8 text-neutral-900 dark:text-neutral-300 mb-3" />
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
                  <Calendar className="h-8 w-8 text-neutral-900 dark:text-neutral-300 mb-3" />
                  <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Monatliche Planung
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Planen Sie Ihre Sitzungen
                  </p>
                </div>
              </Link>

              <Link href="/sessions/logger" className="group">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700 p-6 hover:shadow-lg hover:border-green-400 dark:hover:border-green-500 transition-all">
                  <LogOut className="h-8 w-8 text-green-600 dark:text-green-400 mb-3 rotate-180" />
                  <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    Sitzungen Protokollieren
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Absolvierte Sitzungen erfassen
                  </p>
                </div>
              </Link>

              <Link href="/dashboard/ausgaben" className="group">
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all">
                  <CreditCard className="h-8 w-8 text-neutral-900 dark:text-neutral-300 mb-3" />
                  <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Ausgaben
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Erfassen Sie Betriebsausgaben
                  </p>
                </div>
              </Link>

              <Link href="/dashboard/import" className="group">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 p-6 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all">
                  <Download className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Daten Import
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    LATIDO Daten importieren
                  </p>
                </div>
              </Link>

              <Link href="/dashboard/analyse" className="group">
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all">
                  <DollarSign className="h-8 w-8 text-green-700 dark:text-green-500 mb-3" />
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
                  <BarChart3 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mb-3" />
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
                  <Settings className="h-8 w-8 text-gray-700 dark:text-gray-400 mb-3" />
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
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Projekt-Fortschritt
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Phase 3: Therapiearten Management</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600 dark:text-green-400">Abgeschlossen</span>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Phase 4: Monatliche Planung</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600 dark:text-green-400">Abgeschlossen</span>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Phase 5: Break-Even Analyse</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600 dark:text-green-400">Abgeschlossen</span>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Phase 6: Ausgaben & Einstellungen</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600 dark:text-green-400">Abgeschlossen</span>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Phase 7: Österreichische Steuer & Vorlagen</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600 dark:text-green-400">Abgeschlossen</span>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Phase 8: LATIDO Integration (Import)</span>
                  <div className="flex items-center gap-1">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-600 dark:text-blue-400">In Bearbeitung</span>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Erste Schritte
              </h3>
            </div>
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
                <strong>4. Daten importieren:</strong> Importieren Sie Sitzungsdaten aus LATIDO (optional)
              </li>
              <li>
                <strong>5. Planung:</strong> Planen Sie Ihre Sitzungen für den aktuellen Monat
              </li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  )
}
