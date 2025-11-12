'use client'

import type { MonthlyMetrics, TherapyMetrics, DashboardSummary } from '@/lib/actions/dashboard'
import { BusinessDashboard } from './business-dashboard'
import { TaxPlanningCard } from './tax-planning-card'
import { BarChart3, TrendingUp } from 'lucide-react'

interface ReportsViewProps {
  monthlyData: MonthlyMetrics[]
  therapyMetrics: TherapyMetrics[]
  summary: DashboardSummary
}

export function ReportsView({
  monthlyData,
  therapyMetrics,
  summary
}: ReportsViewProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          Geschäftsberichte
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Umfassende Übersicht Ihrer Geschäftsentwicklung
        </p>
      </div>

      {/* Info Box */}
      {monthlyData.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Keine Daten verfügbar
          </h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            Die Berichte werden basierend auf Ihre monatlichen Planungen und tatsächlichen Sitzungen generiert. Starten Sie mit der Erfassung Ihrer Daten in der monatlichen Planung.
          </p>
        </div>
      )}

      {/* Dashboard */}
      {monthlyData.length > 0 && (
        <>
          <BusinessDashboard
            monthlyData={monthlyData}
            therapyMetrics={therapyMetrics}
            summary={summary}
          />

          {/* Austrian Tax Planning */}
          <TaxPlanningCard
            grossRevenue={summary.total_revenue}
            totalExpenses={summary.total_expenses}
            practiceType="mixed"
            privatePatientRevenue={summary.total_revenue * 0.5} // Assume 50% private patients
          />
        </>
      )}

      {/* Help Section */}
      <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          📚 Wie Sie die Berichte nutzen
        </h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Umsatz & Gewinn
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Sehen Sie Ihren Umsatz und Gewinn im Zeitverlauf. Vergleichen Sie geplante und tatsächliche Ergebnisse, um Ihre Prognosegenauigkeit zu verbessern.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Therapiearten-Vergleich
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Identifizieren Sie Ihre profitabelsten Therapiearten. Nutzen Sie diese Informationen, um Ihr Angebot zu optimieren und Ihre Auslastung zu verbessern.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
              Key Metrics
            </h4>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1 list-disc list-inside">
              <li>
                <strong>Gesamtumsatz:</strong> Summe aller Einnahmen aus Therapiesitzungen
              </li>
              <li>
                <strong>Gewinn/Verlust:</strong> Umsatz minus Ausgaben
              </li>
              <li>
                <strong>Gewinnmarge:</strong> Gewinn als Prozentsatz des Umsatzes
              </li>
              <li>
                <strong>Ø Sitzungspreis:</strong> Durchschnittlicher Preis pro Sitzung
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
              💡 Tipps zur Datenerfassung
            </h4>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1 list-disc list-inside">
              <li>
                Aktualisieren Sie monatlich Ihre geplanten Sitzungen
              </li>
              <li>
                Tragen Sie am Monatsende die tatsächlich durchgeführten Sitzungen ein
              </li>
              <li>
                Erfassen Sie alle Ausgaben in der Kostenberechnung
              </li>
              <li>
                Überprüfen Sie regelmäßig Ihre Therapiearten-Preise
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
