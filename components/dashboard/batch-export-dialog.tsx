'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Download, Loader2, FileText } from 'lucide-react'

export interface BatchExportOptions {
  breakEven: boolean
  monthlyPlanning: boolean
  therapyPerformance: boolean
  expenseSummary: boolean
  monthlyResults: boolean
}

export interface ExportFormatSelection {
  breakEven: 'pdf' | 'xlsx' | 'csv'
  monthlyPlanning: 'pdf' | 'xlsx' | 'csv'
  therapyPerformance: 'pdf' | 'xlsx' | 'csv'
  expenseSummary: 'pdf' | 'xlsx' | 'csv'
  monthlyResults: 'pdf' | 'xlsx' | 'csv'
}

interface BatchExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport?: (options: BatchExportOptions, formats: ExportFormatSelection) => Promise<void>
}

export function BatchExportDialog({ open, onOpenChange, onExport }: BatchExportDialogProps) {
  const [selectedReports, setSelectedReports] = useState<BatchExportOptions>({
    breakEven: true,
    monthlyPlanning: true,
    therapyPerformance: false,
    expenseSummary: true,
    monthlyResults: false
  })

  const [formats, setFormats] = useState<ExportFormatSelection>({
    breakEven: 'pdf',
    monthlyPlanning: 'xlsx',
    therapyPerformance: 'xlsx',
    expenseSummary: 'xlsx',
    monthlyResults: 'xlsx'
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleReportToggle = useCallback((report: keyof BatchExportOptions) => {
    setSelectedReports(prev => ({
      ...prev,
      [report]: !prev[report]
    }))
  }, [])

  const handleFormatChange = useCallback((report: keyof ExportFormatSelection, format: string) => {
    setFormats(prev => ({
      ...prev,
      [report]: format as 'pdf' | 'xlsx' | 'csv'
    }))
  }, [])

  const handleExport = async () => {
    try {
      setIsLoading(true)

      // Check if at least one report is selected
      const anySelected = Object.values(selectedReports).some(v => v)
      if (!anySelected) {
        toast.error('Bitte wählen Sie mindestens einen Bericht aus')
        return
      }

      // If custom onExport handler provided, use it
      if (onExport) {
        await onExport(selectedReports, formats)
        onOpenChange(false)
        return
      }

      // Default batch export implementation
      const zip = new JSZip()

      // Create folder structure
      const monthlyFolder = zip.folder('monthly')
      const reportsFolder = zip.folder('reports')
      const therapiesFolder = zip.folder('therapies')

      // Add placeholder files for each selected report
      // In a real implementation, these would contain actual data
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')

      if (selectedReports.monthlyPlanning) {
        const data = {
          'Monat': format(new Date(), 'MMMM yyyy', { locale: de }),
          'Status': 'Placeholder Data',
          'Erstellt': new Date().toISOString()
        }
        const content = JSON.stringify(data, null, 2)
        monthlyFolder?.file(`planning-${timestamp}.txt`, content)
      }

      if (selectedReports.monthlyResults) {
        const data = {
          'Monat': format(new Date(), 'MMMM yyyy', { locale: de }),
          'Status': 'Placeholder Data',
          'Erstellt': new Date().toISOString()
        }
        const content = JSON.stringify(data, null, 2)
        monthlyFolder?.file(`results-${timestamp}.txt`, content)
      }

      if (selectedReports.breakEven) {
        const data = {
          'Bericht': 'Break-Even Analyse',
          'Status': 'Placeholder Data',
          'Erstellt': new Date().toISOString()
        }
        const content = JSON.stringify(data, null, 2)
        reportsFolder?.file(`break-even-${timestamp}.txt`, content)
      }

      if (selectedReports.expenseSummary) {
        const data = {
          'Bericht': 'Ausgabenübersicht',
          'Status': 'Placeholder Data',
          'Erstellt': new Date().toISOString()
        }
        const content = JSON.stringify(data, null, 2)
        reportsFolder?.file(`expenses-${timestamp}.txt`, content)
      }

      if (selectedReports.therapyPerformance) {
        const data = {
          'Bericht': 'Therapieleistung',
          'Status': 'Placeholder Data',
          'Erstellt': new Date().toISOString()
        }
        const content = JSON.stringify(data, null, 2)
        therapiesFolder?.file(`performance-${timestamp}.txt`, content)
      }

      // Add README file
      const readmeContent = `WIRTSCHAFTLICHKEITSPLAN EXPORT
=====================================

Exportdatum: ${format(new Date(), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
Format Version: 1.0

Enthaltene Berichte:
${selectedReports.monthlyPlanning ? '- Monatliche Planung (Format: ' + formats.monthlyPlanning.toUpperCase() + ')\n' : ''}${selectedReports.monthlyResults ? '- Monatliche Ergebnisse (Format: ' + formats.monthlyResults.toUpperCase() + ')\n' : ''}${selectedReports.breakEven ? '- Break-Even Analyse (Format: ' + formats.breakEven.toUpperCase() + ')\n' : ''}${selectedReports.expenseSummary ? '- Ausgabenübersicht (Format: ' + formats.expenseSummary.toUpperCase() + ')\n' : ''}${selectedReports.therapyPerformance ? '- Therapieleistung (Format: ' + formats.therapyPerformance.toUpperCase() + ')\n' : ''}

Struktur:
- /monthly/     - Monatliche Berichte
- /reports/     - Analyseberichte
- /therapies/   - Therapiespezifische Berichte

Diese ZIP-Datei enthält möglicherweise sensible Geschäftsdaten.
Bitte behandeln Sie diese vertraulich.

Für weitere Informationen besuchen Sie: https://wirtschaftlichkeitsplan.at
`

      zip.file('README.txt', readmeContent)

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })

      // Download ZIP
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Wirtschaftlichkeitsplan_Export_${timestamp}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Batch-Export erfolgreich erstellt')
      onOpenChange(false)
    } catch (error) {
      console.error('Batch export failed:', error)
      toast.error('Fehler beim Erstellen des Batch-Exports')
    } finally {
      setIsLoading(false)
    }
  }

  const reports = [
    {
      id: 'breakEven',
      label: 'Break-Even Analyse',
      description: 'Analyse der Rentabilität und des Break-Even-Punktes'
    },
    {
      id: 'monthlyPlanning',
      label: 'Monatliche Planung',
      description: 'Geplante Sitzungen, Umsatz und Ressourcen pro Monat'
    },
    {
      id: 'therapyPerformance',
      label: 'Therapieleistung',
      description: 'Detaillierte Leistungsmetriken für jede Therapieart'
    },
    {
      id: 'expenseSummary',
      label: 'Ausgabenübersicht',
      description: 'Zusammenfassung aller Ausgaben und Kosten'
    },
    {
      id: 'monthlyResults',
      label: 'Monatliche Ergebnisse',
      description: 'Tatsächliche Ergebnisse vs. Planung'
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Batch-Export
          </DialogTitle>
          <DialogDescription>
            Wählen Sie die Berichte und Formate für den Export aus. Diese werden in einer ZIP-Datei zusammengefasst.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Selection */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Zu exportierende Berichte:</h3>
            <div className="space-y-3">
              {reports.map(report => (
                <div key={report.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <Checkbox
                    id={report.id}
                    checked={selectedReports[report.id as keyof BatchExportOptions]}
                    onCheckedChange={() => handleReportToggle(report.id as keyof BatchExportOptions)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor={report.id} className="text-sm font-medium cursor-pointer block">
                      {report.label}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                  </div>
                  <Select
                    value={formats[report.id as keyof ExportFormatSelection]}
                    onValueChange={(value) => handleFormatChange(report.id as keyof ExportFormatSelection, value)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Format Info */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex gap-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Export-Informationen:</p>
                <ul className="text-xs space-y-1">
                  <li>PDF: Hochwertige Druckqualität für Berichte</li>
                  <li>Excel: Formatierte Tabellen mit Formeln und Diagrammen</li>
                  <li>CSV: Universelles Format für Tabellenkalkulationen</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Selected Count */}
          <div className="text-sm text-muted-foreground">
            {Object.values(selectedReports).filter(Boolean).length} Bericht(e) ausgewählt
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || !Object.values(selectedReports).some(Boolean)}
            className="gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Exportiere...' : 'Batch-Export erstellen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
