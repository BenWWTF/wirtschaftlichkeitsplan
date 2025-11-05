'use client'

import type { BreakEvenAnalysis } from '@/lib/types'
import { BreakEvenCalculator } from './break-even-calculator'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface AnalysisViewProps {
  therapies: BreakEvenAnalysis[]
}

export function AnalysisView({ therapies }: AnalysisViewProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          Break-Even Analyse
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Finden Sie heraus, wie viele Sitzungen Sie pro Monat benötigen, um kostendeckend zu arbeiten
        </p>
      </div>

      {/* Info Box */}
      {therapies.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Erste Schritte
          </h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
            Sie müssen zuerst Therapiearten erstellen, bevor Sie die Break-Even-Analyse verwenden können.
          </p>
          <Link
            href="/dashboard/therapien"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Zu Therapiearten
            <span>→</span>
          </Link>
        </div>
      )}

      {/* Calculator */}
      <BreakEvenCalculator therapies={therapies} initialFixedCosts={2000} />

      {/* Help Section */}
      <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          📚 Wie funktioniert die Break-Even-Analyse?
        </h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
              Was ist der Break-Even-Punkt?
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Der Break-Even-Punkt ist die Anzahl der Sitzungen pro Monat, die Sie durchführen müssen, um Ihre Fixkosten zu decken und weder Gewinn noch Verlust zu machen.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
              Deckungsbeitrag
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Der Deckungsbeitrag ist die Differenz zwischen dem Preis einer Sitzung und den variablen Kosten. Dieser Betrag trägt zur Deckung Ihrer Fixkosten bei.
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              <strong>Deckungsbeitrag = Preis pro Sitzung - Variable Kosten</strong>
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
              Berechnung
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <strong>Sessions für Break-Even = Fixkosten ÷ Deckungsbeitrag</strong>
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              Wenn Sie über diesem Punkt liegen, machen Sie Gewinn. Darunter machen Sie Verlust.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
              Was sind Fixkosten?
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Fixkosten sind Ausgaben, die sich nicht mit der Anzahl der Sitzungen ändern, z.B.:
            </p>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 list-disc list-inside mt-1 space-y-1">
              <li>Mietkosten</li>
              <li>Versicherungen</li>
              <li>Verwaltungskosten</li>
              <li>Marketing</li>
              <li>Nebenkosten</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
            ✅ So senken Sie Ihren Break-Even-Punkt:
          </h4>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>• Erhöhen Sie Ihre Preise</li>
            <li>• Senken Sie variable Kosten</li>
            <li>• Reduzieren Sie Fixkosten</li>
            <li>• Erhöhen Sie Ihre Auslastung</li>
          </ul>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
          <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
            💡 Tipps zur Optimierung:
          </h4>
          <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
            <li>• Überwachen Sie Ihre Fixkosten regelmäßig</li>
            <li>• Verhandeln Sie mit Anbietern</li>
            <li>• Nutzen Sie Technologie zur Automatisierung</li>
            <li>• Analysieren Sie Ihre profitabelsten Therapiearten</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
