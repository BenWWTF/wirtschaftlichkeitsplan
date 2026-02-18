'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet, History } from 'lucide-react'
import { toast } from 'sonner'
import { parseLatidoExcel, processLatidoSessions } from '@/lib/actions/latido-import'
import { LatidoImportHistory } from './latido-import-history'

interface LatidoImportFormProps {
  onImportComplete?: (importedMonths?: string[]) => void
}

type ImportStep = 'upload' | 'preview' | 'processing' | 'complete'
type ViewMode = 'upload' | 'history'

export function LatidoImportForm({ onImportComplete }: LatidoImportFormProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<ImportStep>('upload')
  const [viewMode, setViewMode] = useState<ViewMode>('upload')
  const [fileName, setFileName] = useState<string>('')
  const [preview, setPreview] = useState<{
    sessionCount: number
    rowsProcessed: number
    errors: Array<{ row: number; message: string }>
    warnings: Array<{ row: number; message: string }>
    summary?: {
      totalInvoices: number
      validInvoices: number
      cancelledInvoices: number
      monthlyBreakdown: Record<string, { sessions: number; revenue: number }>
    }
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsedSessions, setParsedSessions] = useState<any[]>([])
  const [importResult, setImportResult] = useState<{
    imported_count: number
    duplicate_count: number
    skipped_count: number
    imported_months: string[]
  } | null>(null)

  const handleFile = async (file: File) => {
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream'
    ]
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an Excel file (.xlsx or .xls)')
      return
    }

    // Validate file size
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File is too large. Maximum size is 10MB')
      return
    }

    setIsLoading(true)
    setFileName(file.name)

    try {
      // Convert file to base64 for server transfer
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')

      // Parse Excel file
      const result = await parseLatidoExcel(base64)

      if (!result.success && result.sessions.length === 0) {
        toast.error('Keine gültigen Honorarnoten gefunden')
        setIsLoading(false)
        return
      }

      // Store parsed sessions for import step
      setParsedSessions(result.sessions)

      // Show preview
      setPreview({
        sessionCount: result.sessionCount,
        rowsProcessed: result.rowsProcessed,
        errors: result.errors,
        warnings: result.warnings || [],
        summary: result.summary,
      })
      setStep('preview')

      if (result.errors.length > 0) {
        toast.warning(`Found ${result.errors.length} errors while parsing file`)
      } else {
        toast.success(`Found ${result.sessionCount} sessions to import`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse Excel file'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleConfirmImport = async () => {
    if (!preview) return

    setStep('processing')
    setIsLoading(true)

    try {
      // Process stored sessions
      const result = await processLatidoSessions(parsedSessions)

      // Store result for completion screen
      setImportResult({
        imported_count: result.imported_count,
        duplicate_count: result.duplicate_count || 0,
        skipped_count: result.skipped_count,
        imported_months: result.imported_months || [],
      })

      // Show warnings (e.g. no price match)
      if (result.warnings?.length > 0) {
        result.warnings.slice(0, 3).forEach((w: any) => toast.warning(w.message))
      }

      if (result.duplicate_count > 0) {
        toast.info(`${result.duplicate_count} bereits importierte Rechnungen übersprungen`)
      }

      if (result.imported_count > 0) {
        toast.success(`${result.imported_count} Sitzungen erfolgreich importiert`)
        setStep('complete')
        setTimeout(() => {
          onImportComplete?.(result.imported_months)
        }, 1500)
      } else if (result.duplicate_count > 0 && result.imported_count === 0) {
        toast.info('Alle Rechnungen wurden bereits importiert (keine neuen Daten)')
        setStep('complete')
        setTimeout(() => {
          onImportComplete?.(result.imported_months)
        }, 1500)
      } else if (result.warnings?.length > 0) {
        toast.error('Keine Sitzungen importiert. Therapietypen konnten nicht zugeordnet werden.')
        setStep('preview')
      } else if (result.errors?.length > 0) {
        toast.error(result.errors[0]?.message || 'Import fehlgeschlagen')
        setStep('preview')
      } else {
        toast.error('Import fehlgeschlagen')
        setStep('preview')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import sessions'
      toast.error(message)
      setStep('preview')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setStep('upload')
    setFileName('')
    setPreview(null)
    setParsedSessions([])
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Toggle */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => setViewMode('upload')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'upload'
              ? 'border-accent-600 text-accent-600 dark:text-accent-400'
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-300'
          }`}
        >
          <Upload className="h-4 w-4 inline mr-2" />
          Datei hochladen
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'history'
              ? 'border-accent-600 text-accent-600 dark:text-accent-400'
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-300'
          }`}
        >
          <History className="h-4 w-4 inline mr-2" />
          Importhistorie
        </button>
      </div>

      {/* History View */}
      {viewMode === 'history' && (
        <LatidoImportHistory onImportRemoved={() => {
          toast.success('Import entfernt und Sitzungen aktualisiert')
          onImportComplete?.()
        }} />
      )}

      {/* Upload View */}
      {viewMode === 'upload' && (
        <>
          {step === 'upload' && (
        <>
          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed p-12 text-center transition ${
              isDragActive
                ? 'border-accent-500 bg-accent-50 dark:bg-accent-950'
                : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleChange}
              disabled={isLoading}
              className="absolute inset-0 cursor-pointer opacity-0"
            />

            <FileSpreadsheet className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500 mb-4" />
            <p className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
              {isLoading ? 'Verarbeite Datei...' : 'Latido Excel-Export hochladen'}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Ziehen Sie die Datei hierher oder klicken Sie zum Auswählen
            </p>
          </div>

          <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-4">
            <p className="text-sm text-accent-900 dark:text-accent-100">
              <strong>Latido Honorarnoten-Export:</strong> Rechnungen werden automatisch erkannt. Stornos werden ausgeschlossen. Therapietypen werden anhand des Preises zugeordnet. Bereits importierte Rechnungen werden anhand der Rechnungsnummer erkannt und übersprungen.
            </p>
          </div>
        </>
      )}

      {step === 'preview' && preview && (
        <>
          {/* Preview Summary */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">
                  {preview.sessionCount} gültige Honorarnoten erkannt
                </p>
                {preview.summary && (
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 space-y-0.5">
                    <p>{preview.summary.totalInvoices} Rechnungen insgesamt, {preview.summary.cancelledInvoices} Stornos ausgeschlossen</p>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Breakdown */}
            {preview.summary && Object.keys(preview.summary.monthlyBreakdown).length > 0 && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Monatliche Übersicht:</p>
                <div className="space-y-1">
                  {Object.entries(preview.summary.monthlyBreakdown)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([month, data]) => {
                      const [y, m] = month.split('-')
                      const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
                      const label = `${monthNames[parseInt(m) - 1]} ${y}`
                      return (
                        <div key={month} className="flex justify-between text-sm">
                          <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
                          <span className="text-neutral-900 dark:text-white font-medium">
                            {data.sessions} {data.sessions === 1 ? 'Sitzung' : 'Sitzungen'} · {data.revenue.toFixed(2)}€
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {preview.errors.length > 0 && (
              <div className="flex items-start gap-3 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {preview.errors.length} Fehler
                  </p>
                  <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                    {preview.errors.slice(0, 5).map((error, i) => (
                      <p key={i} className="text-xs text-amber-700 dark:text-amber-300">
                        Zeile {error.row}: {error.message}
                      </p>
                    ))}
                    {preview.errors.length > 5 && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        + {preview.errors.length - 5} weitere
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={isLoading || preview.sessionCount === 0}
              className="flex-1"
            >
              {isLoading ? 'Importiere...' : 'Importieren'}
            </Button>
          </div>
        </>
      )}

      {step === 'processing' && (
        <div className="text-center py-12 space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin">
              <Upload className="h-8 w-8 text-accent-600" />
            </div>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Importiere Sitzungen...
          </p>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center py-12 space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto" />
          <p className="text-lg font-medium text-neutral-900 dark:text-white">
            Import erfolgreich!
          </p>
          {importResult && (
            <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
              {importResult.imported_count > 0 && (
                <p>{importResult.imported_count} neue Sitzungen importiert</p>
              )}
              {importResult.duplicate_count > 0 && (
                <p>{importResult.duplicate_count} bereits importierte Rechnungen übersprungen</p>
              )}
              {importResult.skipped_count > 0 && (
                <p>{importResult.skipped_count} Sitzungen ohne passenden Therapietyp</p>
              )}
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  )
}
