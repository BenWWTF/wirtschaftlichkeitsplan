'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Upload, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import {
  parseCSV,
  getCSVHeaders,
  detectColumnMapping,
  parseSessionImport,
  generateImportPreview,
  generateSessionImportTemplate,
  generateLATIDOTemplate
} from '@/lib/utils/csv-parser'
import {
  processSessionImport,
  validateTherapyTypes
} from '@/lib/actions/import'
import type {
  CSVImportConfig,
  ImportColumnMapping,
  SessionImportRow,
  ImportPreview
} from '@/lib/types/import'

interface DataImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: () => void
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'processing' | 'complete'

export function DataImportDialog({
  open,
  onOpenChange,
  onImportComplete
}: DataImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvContent, setCSVContent] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [config, setConfig] = useState<CSVImportConfig>({
    has_header: true,
    delimiter: ',',
    encoding: 'utf-8',
    date_format: 'YYYY-MM-DD'
  })
  const [mapping, setMapping] = useState<Partial<ImportColumnMapping>>({})
  const [parsedRows, setParsedRows] = useState<SessionImportRow[]>([])
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [missingTherapies, setMissingTherapies] = useState<string[]>([])

  // Reset dialog state
  const resetDialog = useCallback(() => {
    setStep('upload')
    setFile(null)
    setCSVContent('')
    setHeaders([])
    setMapping({})
    setParsedRows([])
    setPreview(null)
    setMissingTherapies([])
  }, [])

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    if (!uploadedFile.name.endsWith('.csv')) {
      toast.error('Bitte wählen Sie eine CSV-Datei')
      return
    }

    setFile(uploadedFile)
    const reader = new FileReader()

    reader.onload = (event) => {
      const content = event.target?.result as string
      setCSVContent(content)

      // Extract headers
      const csvHeaders = getCSVHeaders(content, config.delimiter)
      setHeaders(csvHeaders)

      // Auto-detect mapping
      const detectedMapping = detectColumnMapping(csvHeaders)
      setMapping(detectedMapping)

      setStep('mapping')
      toast.success('Datei erfolgreich geladen')
    }

    reader.onerror = () => {
      toast.error('Fehler beim Lesen der Datei')
    }

    reader.readAsText(uploadedFile)
  }, [config.delimiter])

  // Handle mapping configuration and parse
  const handleParseData = useCallback(async () => {
    if (!mapping.date_column || !mapping.therapy_type_column || !mapping.sessions_column) {
      toast.error('Bitte wählen Sie mindestens Datum, Therapieart und Sitzungen Spalten')
      return
    }

    try {
      const result = parseSessionImport(csvContent, config, mapping as ImportColumnMapping)

      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} Fehler beim Parsen gefunden`)
        console.error('Parse errors:', result.errors)
        return
      }

      if (result.warnings.length > 0) {
        toast.warning(`${result.warnings.length} Warnungen beim Parsen`)
      }

      setParsedRows(result.rows)

      // Generate preview
      const importPreview = generateImportPreview(result.rows)
      setPreview(importPreview)

      // Validate therapy types
      const therapyNames = [...new Set(result.rows.map(r => r.therapy_type))]
      const validation = await validateTherapyTypes(therapyNames)

      if (validation.missing.length > 0) {
        setMissingTherapies(validation.missing)
        toast.warning(`${validation.missing.length} Therapiearten nicht gefunden`)
      }

      setStep('preview')
      toast.success('Daten erfolgreich geparst')
    } catch (error) {
      toast.error('Fehler beim Parsen der Daten')
      console.error(error)
    }
  }, [csvContent, config, mapping])

  // Handle import execution
  const handleImport = useCallback(async () => {
    setStep('processing')

    try {
      const result = await processSessionImport(parsedRows)

      if (result.success) {
        toast.success(`${result.imported_count} Sitzungen erfolgreich importiert`)
        setStep('complete')
        setTimeout(() => {
          onImportComplete?.()
          onOpenChange(false)
          resetDialog()
        }, 2000)
      } else {
        toast.error(`Import fehlgeschlagen: ${result.errors.length} Fehler`)
        setStep('preview')
      }

      if (result.warnings.length > 0) {
        toast.warning(`${result.skipped_count} Einträge übersprungen`)
      }
    } catch (error) {
      toast.error('Fehler beim Importieren')
      console.error(error)
      setStep('preview')
    }
  }, [parsedRows, onImportComplete, onOpenChange, resetDialog])

  // Download template
  const handleDownloadTemplate = (format: 'standard' | 'latido') => {
    const content = format === 'latido' ? generateLATIDOTemplate() : generateSessionImportTemplate()
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = format === 'latido' ? 'latido_import_template.csv' : 'session_import_template.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Vorlage heruntergeladen')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen)
      if (!isOpen) resetDialog()
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Daten Import aus Ordinationssoftware</DialogTitle>
          <DialogDescription>
            Importieren Sie Sitzungsdaten aus LATIDO, CGM, Medatixx oder anderen Systemen
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. CSV-Datei hochladen</CardTitle>
                <CardDescription>
                  Laden Sie eine CSV-Datei mit Ihren Sitzungsdaten hoch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="max-w-xs mx-auto"
                  />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    Oder Datei hierher ziehen
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Trennzeichen</Label>
                  <Select
                    value={config.delimiter}
                    onValueChange={(value) => setConfig({ ...config, delimiter: value as ',' | ';' | '\t' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Komma (,)</SelectItem>
                      <SelectItem value=";">Semikolon (;)</SelectItem>
                      <SelectItem value="\t">Tab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vorlagen herunterladen</CardTitle>
                <CardDescription>
                  Nutzen Sie unsere Vorlagen für einen einfacheren Import
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleDownloadTemplate('latido')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  LATIDO Format (Deutsch)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleDownloadTemplate('standard')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Standard Format (English)
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mapping Step */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>2. Spalten zuordnen</CardTitle>
                <CardDescription>
                  Ordnen Sie die Spalten Ihrer CSV-Datei den entsprechenden Feldern zu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Datum Spalte *</Label>
                  <Select
                    value={mapping.date_column}
                    onValueChange={(value) => setMapping({ ...mapping, date_column: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie eine Spalte" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Therapieart Spalte *</Label>
                  <Select
                    value={mapping.therapy_type_column}
                    onValueChange={(value) => setMapping({ ...mapping, therapy_type_column: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie eine Spalte" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sitzungen Spalte *</Label>
                  <Select
                    value={mapping.sessions_column}
                    onValueChange={(value) => setMapping({ ...mapping, sessions_column: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie eine Spalte" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Umsatz Spalte (optional)</Label>
                  <Select
                    value={mapping.revenue_column || 'none'}
                    onValueChange={(value) => setMapping({ ...mapping, revenue_column: value === 'none' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Keine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleParseData} className="w-full">
                  Daten parsen
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && preview && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>3. Vorschau</CardTitle>
                <CardDescription>
                  Überprüfen Sie die zu importierenden Daten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Gültige Zeilen
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {preview.valid_rows}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Gesamt Sitzungen
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {preview.total_sessions}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Zeitraum</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {preview.date_range.start} bis {preview.date_range.end}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Gefundene Therapiearten</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.therapy_types_found.map((type) => (
                      <span
                        key={type}
                        className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {missingTherapies.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                          Fehlende Therapiearten
                        </p>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                          Die folgenden Therapiearten existieren nicht in Ihrer Datenbank und werden übersprungen:
                        </p>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside">
                          {missingTherapies.map((therapy) => (
                            <li key={therapy}>{therapy}</li>
                          ))}
                        </ul>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                          Bitte erstellen Sie diese Therapiearten zuerst in der Therapieverwaltung.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => setStep('mapping')} variant="outline" className="flex-1">
                    Zurück
                  </Button>
                  <Button onClick={handleImport} className="flex-1">
                    {missingTherapies.length > 0 ? 'Trotzdem importieren' : 'Jetzt importieren'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Importiere Daten...</p>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Import erfolgreich abgeschlossen!</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
