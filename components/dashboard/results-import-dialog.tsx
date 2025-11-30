'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataImportDialog } from './data-import-dialog'
import { LatidoImportForm } from './latido-import-form'
import { FileText, FileSpreadsheet } from 'lucide-react'

interface ResultsImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: () => void
}

export function ResultsImportDialog({
  open,
  onOpenChange,
  onImportComplete
}: ResultsImportDialogProps) {
  const [activeTab, setActiveTab] = useState('csv')
  const [showDataImport, setShowDataImport] = useState(false)

  const handleDataImportComplete = () => {
    setShowDataImport(false)
    onOpenChange(false)
    onImportComplete?.()
  }

  const handleLatidoImportComplete = () => {
    onOpenChange(false)
    onImportComplete?.()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ergebnisse importieren</DialogTitle>
            <DialogDescription>
              Importieren Sie tatsächliche Sitzungsdaten aus einer CSV-Datei oder Latido Excel-Export
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="csv" className="gap-2">
                <FileText className="h-4 w-4" />
                CSV Upload
              </TabsTrigger>
              <TabsTrigger value="excel" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Excel (Latido)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="mt-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Laden Sie eine CSV-Datei mit Sitzungsdaten hoch. Die Datei wird automatisch nach Monat und Therapieart aggregiert.
                </p>
              </div>
              <button
                onClick={() => setShowDataImport(true)}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                CSV-Datei auswählen
              </button>
            </TabsContent>

            <TabsContent value="excel" className="mt-6">
              <LatidoImportForm onImportComplete={handleLatidoImportComplete} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Embedded CSV Import Dialog */}
      <DataImportDialog
        open={showDataImport}
        onOpenChange={setShowDataImport}
        onImportComplete={handleDataImportComplete}
      />
    </>
  )
}
