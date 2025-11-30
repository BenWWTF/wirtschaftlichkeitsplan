'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { parseLatidoExcel, processLatidoSessions } from '@/lib/actions/latido-import'

interface LatidoImportFormProps {
  onImportComplete?: () => void
}

type ImportStep = 'upload' | 'preview' | 'processing' | 'complete'

export function LatidoImportForm({ onImportComplete }: LatidoImportFormProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<ImportStep>('upload')
  const [fileName, setFileName] = useState<string>('')
  const [preview, setPreview] = useState<{
    sessionCount: number
    rowsProcessed: number
    errors: Array<{ row: number; message: string }>
    warnings: Array<{ row: number; message: string }>
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Parse Excel file
      const result = await parseLatidoExcel(buffer)

      if (!result.success && result.sessions.length === 0) {
        toast.error('No valid sessions found in Excel file')
        setIsLoading(false)
        return
      }

      // Show preview
      setPreview({
        sessionCount: result.sessionCount,
        rowsProcessed: result.rowsProcessed,
        errors: result.errors,
        warnings: result.errors,
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
      // Parse again to get sessions
      const arrayBuffer = await (fileInputRef.current?.files?.[0] as File).arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const parseResult = await parseLatidoExcel(buffer)

      // Process sessions
      const result = await processLatidoSessions(parseResult.sessions)

      if (result.success) {
        toast.success(`Successfully imported ${result.imported_count} sessions`)
        setStep('complete')
        setTimeout(() => {
          onImportComplete?.()
        }, 1500)
      } else {
        toast.error('Failed to import sessions')
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
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
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
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

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Erwartete Spalten:</strong> Rechnungsdatum, Therapieart, Anzahl Sitzungen (oder englische Äquivalente)
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
                  {preview.sessionCount} Sitzungen gefunden
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  aus {preview.rowsProcessed} Zeilen verarbeitet
                </p>
              </div>
            </div>

            {preview.errors.length > 0 && (
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {preview.errors.length} Fehler gefunden
                  </p>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {preview.errors.slice(0, 3).map((error, i) => (
                      <p key={i} className="text-xs text-amber-700 dark:text-amber-300">
                        Zeile {error.row}: {error.message}
                      </p>
                    ))}
                    {preview.errors.length > 3 && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        + {preview.errors.length - 3} weitere Fehler
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
              <Upload className="h-8 w-8 text-blue-600" />
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
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Ihre Ergebnisse werden in Kürze angezeigt
          </p>
        </div>
      )}
    </div>
  )
}
