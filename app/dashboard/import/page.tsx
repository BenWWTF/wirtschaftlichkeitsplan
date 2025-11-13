'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Upload, FileText, Database, CheckCircle2, Info } from 'lucide-react'

// Dynamic import for data import dialog (complex CSV parsing and form)
const DataImportDialog = dynamic(() => import('@/components/dashboard/data-import-dialog').then(mod => ({ default: mod.DataImportDialog })), {
  loading: () => null,
  ssr: false
})

export default function ImportPage() {
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const handleImportComplete = () => {
    // Could add logic to refresh import history here
    console.log('Import completed')
  }

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Daten Import
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Importieren Sie Sitzungsdaten aus Ihrer Praxissoftware
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Daten importieren
              </CardTitle>
              <CardDescription>
                CSV-Datei aus LATIDO, CGM oder Medatixx hochladen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setImportDialogOpen(true)}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Neuer Import
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Vorlagen
              </CardTitle>
              <CardDescription>
                CSV-Vorlagen für einfacheren Import
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setImportDialogOpen(true)
                }}
                className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                LATIDO Vorlage herunterladen
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setImportDialogOpen(true)
                }}
                className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Standard Vorlage herunterladen
              </a>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              So funktioniert der Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                  Daten exportieren
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Exportieren Sie Ihre Sitzungsdaten aus LATIDO, CGM, Medatixx oder einer anderen Praxissoftware als CSV-Datei.
                </p>
              </div>

              <div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">2</span>
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                  CSV hochladen
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Laden Sie die CSV-Datei hoch und ordnen Sie die Spalten den entsprechenden Feldern zu.
                </p>
              </div>

              <div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">3</span>
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                  Automatisch importieren
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Die Daten werden automatisch Ihren Therapiearten zugeordnet und in die monatlichen Pläne übernommen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supported Software */}
        <Card>
          <CardHeader>
            <CardTitle>Unterstützte Praxissoftware</CardTitle>
            <CardDescription>
              Importieren Sie Daten aus folgenden Systemen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'LATIDO', supported: true },
                { name: 'CGM Albis', supported: true },
                { name: 'Medatixx', supported: true },
                { name: 'PROMEDOX', supported: true },
                { name: 'Andere (CSV)', supported: true },
              ].map((software) => (
                <div
                  key={software.name}
                  className="flex items-center gap-2 p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg"
                >
                  {software.supported ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Database className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">
                    {software.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Tipp: LATIDO Integration
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Wenn Sie LATIDO verwenden, können Sie Ihre Daten direkt aus dem Normdatensatz-Export importieren.
              </p>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Öffnen Sie LATIDO → Werkzeuge → Datenexport</li>
                <li>Wählen Sie &ldquo;Normdatensatz-Format der österreichischen Ärztekammer&rdquo;</li>
                <li>Exportieren Sie die Datei als CSV</li>
                <li>Laden Sie die Datei hier hoch</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Required Data */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Benötigte Daten in der CSV-Datei</CardTitle>
            <CardDescription>
              Ihre CSV-Datei sollte mindestens folgende Spalten enthalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-2 py-0.5 rounded text-xs font-medium">
                  Erforderlich
                </span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    Datum
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Format: YYYY-MM-DD, DD.MM.YYYY oder MM/DD/YYYY
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-2 py-0.5 rounded text-xs font-medium">
                  Erforderlich
                </span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    Therapieart
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Name der Therapie (z.B. &ldquo;Psychotherapie&rdquo;, &ldquo;Gruppentherapie&rdquo;)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-2 py-0.5 rounded text-xs font-medium">
                  Erforderlich
                </span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    Anzahl Sitzungen
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Numerischer Wert (z.B. 1, 2, 3)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded text-xs font-medium">
                  Optional
                </span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    Umsatz, Patientenart, Notizen
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Zusätzliche Informationen für detailliertere Analysen
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import Dialog */}
        <DataImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImportComplete={handleImportComplete}
        />
      </div>
    </main>
  )
}
