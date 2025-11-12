'use client'

import { useState } from 'react'
import type { BreakEvenAnalysis } from '@/lib/types'
import { exportAsCSV, exportAsJSON, exportAsHTML, printReport } from '@/lib/utils/export-report'
import { Download, FileJson, FileText, Printer, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface BreakEvenExportProps {
  therapies: BreakEvenAnalysis[]
  fixedCosts: number
  sessionsNeeded: number
}

export function BreakEvenExport({
  therapies,
  fixedCosts,
  sessionsNeeded
}: BreakEvenExportProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Calculate average contribution margin
  const avgContribution =
    therapies.length > 0
      ? therapies.reduce((sum, t) => sum + t.contribution_margin, 0) / therapies.length
      : 0

  const reportData = {
    title: 'Break-Even Analysebericht',
    generatedAt: new Date().toLocaleString('de-AT'),
    fixedCosts,
    therapies,
    sessionsNeeded,
    avgContribution
  }

  const handleExportCSV = () => {
    try {
      exportAsCSV(reportData)
      toast.success('Report als CSV exportiert')
      setIsOpen(false)
    } catch (error) {
      toast.error('Fehler beim Exportieren als CSV')
      console.error(error)
    }
  }

  const handleExportJSON = () => {
    try {
      exportAsJSON(reportData)
      toast.success('Report als JSON exportiert')
      setIsOpen(false)
    } catch (error) {
      toast.error('Fehler beim Exportieren als JSON')
      console.error(error)
    }
  }

  const handleExportHTML = () => {
    try {
      exportAsHTML(reportData)
      toast.success('Report als HTML exportiert')
      setIsOpen(false)
    } catch (error) {
      toast.error('Fehler beim Exportieren als HTML')
      console.error(error)
    }
  }

  const handlePrint = () => {
    try {
      printReport(reportData)
      setIsOpen(false)
    } catch (error) {
      toast.error('Fehler beim Drucken')
      console.error(error)
    }
  }

  return (
    <div className="relative inline-block">
      {/* Main Export Button */}
      <div className="flex gap-2">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          className="gap-2"
          title="Exportieren oder drucken"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportieren</span>
        </Button>
      </div>

      {/* Export Options Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-lg z-10">
          <div className="p-2">
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
              title="Exportiert als CSV-Datei für Excel oder Google Sheets"
            >
              <FileText className="h-4 w-4" />
              <span>Als CSV exportieren</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
              title="Exportiert als JSON für Datenaustausch"
            >
              <FileJson className="h-4 w-4" />
              <span>Als JSON exportieren</span>
            </button>

            <button
              onClick={handleExportHTML}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
              title="Exportiert als HTML für Ansicht im Browser"
            >
              <FileText className="h-4 w-4" />
              <span>Als HTML exportieren</span>
            </button>

            <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />

            <button
              onClick={handlePrint}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
              title="Öffnet Druckvorschau"
            >
              <Printer className="h-4 w-4" />
              <span>Drucken</span>
            </button>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 px-4 py-2 bg-neutral-50 dark:bg-neutral-900 rounded-b-lg">
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Exportieren Sie Ihre Break-Even-Analyse in verschiedenen Formaten
            </p>
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
