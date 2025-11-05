'use client'

import { useState, useMemo } from 'react'
import type { TherapyType } from '@/lib/types'
import { MonthSelector } from './month-selector'
import { PlannerGrid } from './planner-grid'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface PlanningViewProps {
  therapies: TherapyType[]
}

export function PlanningView({ therapies }: PlanningViewProps) {
  // Get current month in YYYY-MM format
  const currentMonth = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }, [])

  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Monatliche Planung
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Planen Sie Ihre Therapiesitzungen für jeden Monat
          </p>
        </div>
      </div>

      {/* Month Selector */}
      <MonthSelector
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      {/* Info Box */}
      {therapies.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Erste Schritte
          </h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
            Sie müssen zuerst Therapiearten erstellen, bevor Sie Ihre Planung beginnen können.
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

      {/* Planner Grid */}
      <PlannerGrid
        therapies={therapies}
        month={selectedMonth}
        onAddTherapy={() => {
          // Navigation handled via link in info box
        }}
      />

      {/* Quick Help */}
      <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">
          📋 Wie funktioniert die Planung?
        </h3>
        <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          <li className="flex gap-3">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">1.</span>
            <span>
              Wählen Sie einen Monat aus oder navigieren Sie mit den Pfeilen
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">2.</span>
            <span>Klicken Sie auf eine Therapieart um die Details zu öffnen</span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">3.</span>
            <span>Geben Sie die geplante Anzahl der Sitzungen ein</span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">4.</span>
            <span>
              Speichern Sie Ihre Planung, um den Umsatz und Deckungsbeitrag zu sehen
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">5.</span>
            <span>
              Am Monatsende können Sie die tatsächliche Anzahl der Sitzungen eintragen
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
