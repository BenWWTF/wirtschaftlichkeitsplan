'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, AlertCircle, CheckCircle2, Loader, Zap } from 'lucide-react'
import { parseBillImage } from '@/lib/actions/documents'
import { extractTextFromImage } from '@/lib/ocr-utils'
import { toast } from 'sonner'
import { AUSTRIAN_EXPENSE_CATEGORIES } from '@/lib/constants'

interface BillScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuggestion?: (data: BillScannerSuggestion) => void
}

export interface BillScannerSuggestion {
  vendor_name: string
  invoice_date: string
  amount: number
  currency: string
  description: string
  category_hint: string
  raw_text: string
}

export function BillScanner({ open, onOpenChange, onSuggestion }: BillScannerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestion, setSuggestion] = useState<BillScannerSuggestion | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type - OCR supports images and PDFs
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp']
    const pdfTypes = ['application/pdf']
    const allowedTypes = [...imageTypes, ...pdfTypes]

    if (!allowedTypes.includes(file.type)) {
      toast.error('Dateityp nicht unterstützt. Erlaubt: JPG, PNG, WebP, PDF')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Datei ist zu groß (Maximum: 10MB)')
      return
    }

    setSelectedFile(file)

    // Create preview for images only (PDFs don't need preview)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const handleScanBill = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Bitte wählen Sie eine Datei aus')
      return
    }

    setIsProcessing(true)
    try {
      const loadingToast = toast.loading('OCR wird ausgeführt... Dies kann eine Weile dauern')

      // Convert file to base64 (chunk-safe for large files)
      const arrayBuffer = await selectedFile.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ''
      const chunkSize = 8192
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize)
        binary += String.fromCharCode(...chunk)
      }
      const base64 = btoa(binary)

      // Extract text using client-side OCR (Tesseract.js)
      let extractedText = ''
      try {
        extractedText = await extractTextFromImage(base64, selectedFile.type)
        toast.dismiss(loadingToast)
        toast.success('Text erkannt')
      } catch (ocrError) {
        console.error('OCR extraction failed:', ocrError)
        toast.dismiss(loadingToast)
        toast.warning('OCR-Extraktion fehlgeschlagen, verwende Fallback')
        extractedText = 'Rechnung konnte nicht ganz erfolgreich gescannt werden'
      }

      // Parse the extracted text using server action (no need to send base64)
      const result = await parseBillImage(null, extractedText)

      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        setSuggestion(result.data)
        setSelectedCategory(result.data.category_hint || '')
        toast.success('Rechnung erfolgreich analysiert')
      }
    } catch (error) {
      console.error('Error scanning bill:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Fehler beim Analysieren der Rechnung')
      }
    } finally {
      setIsProcessing(false)
    }
  }, [selectedFile])

  const handleAcceptSuggestion = () => {
    if (suggestion) {
      onSuggestion?.({
        ...suggestion,
        category_hint: selectedCategory || suggestion.category_hint
      })
      handleClose()
      toast.success('Rechnung analysiert - Formular wurde aktualisiert')
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreview(null)
    setSuggestion(null)
    setSelectedCategory('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rechnung scannen</DialogTitle>
          <DialogDescription>
            Laden Sie ein Foto einer Rechnung oder ein PDF hoch (JPG, PNG, PDF). OCR wird automatisch die Ausgabedaten extrahieren.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!suggestion ? (
            <>
              {/* File Upload Section */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Rechnung hochladen
                </label>

                {preview ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-4 flex justify-center">
                      <Image
                        src={preview}
                        alt="Preview"
                        width={300}
                        height={300}
                        className="max-h-[300px] max-w-full rounded"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileSelect}
                          disabled={isProcessing}
                          className="hidden"
                        />
                        <span className="block px-4 py-2 text-center border border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm">
                          Andere Datei wählen
                        </span>
                      </label>
                      <Button
                        onClick={handleScanBill}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Wird analysiert...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Rechnung scannen
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                        {selectedFile.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileSelect}
                          disabled={isProcessing}
                          className="hidden"
                        />
                        <span className="block px-4 py-2 text-center border border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm">
                          Datei ändern
                        </span>
                      </label>
                      <Button
                        onClick={handleScanBill}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Wird analysiert...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Rechnung scannen
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      disabled={isProcessing}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-8 cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Datei hierher ziehen oder klicken
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          Unterstützt: JPG, PNG, PDF (Max. 10MB)
                        </p>
                      </div>
                    </div>
                  </label>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-4 space-y-2">
                <div className="flex gap-2">
                  <Zap className="w-5 h-5 text-accent-600 dark:text-accent-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-accent-900 dark:text-accent-200">
                      OCR-gestützte Rechnungserkennung
                    </p>
                    <p className="text-xs text-accent-800 dark:text-accent-300 mt-1">
                      Verwendet Tesseract.js für lokale Textextraktion. Machen Sie ein klares Foto der Rechnung. Die OCR-Verarbeitung erfolgt in Ihrem Browser.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Results Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Rechnung erfolgreich analysiert</span>
                </div>

                <div className="space-y-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                  {/* Vendor Name */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Anbieter/Firma
                    </label>
                    <Input
                      value={suggestion.vendor_name}
                      readOnly
                      className="mt-1 bg-white dark:bg-neutral-700"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Datum
                    </label>
                    <Input
                      type="date"
                      value={suggestion.invoice_date}
                      readOnly
                      className="mt-1 bg-white dark:bg-neutral-700"
                    />
                  </div>

                  {/* Amount */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Betrag
                      </label>
                      <Input
                        type="number"
                        value={suggestion.amount}
                        readOnly
                        className="mt-1 bg-white dark:bg-neutral-700"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Währung
                      </label>
                      <Input
                        value={suggestion.currency}
                        readOnly
                        className="mt-1 bg-white dark:bg-neutral-700"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Beschreibung
                    </label>
                    <Textarea
                      value={suggestion.description}
                      readOnly
                      className="mt-1 bg-white dark:bg-neutral-700"
                      rows={2}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Kategorie
                    </label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUSTRIAN_EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.category} value={cat.category}>
                            {cat.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Extracted Text */}
                {suggestion.raw_text && (
                  <details className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3">
                    <summary className="cursor-pointer font-medium text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100">
                      Erkannter Text anzeigen
                    </summary>
                    <Textarea
                      value={suggestion.raw_text}
                      readOnly
                      className="mt-3 text-xs"
                      rows={6}
                    />
                  </details>
                )}

                {/* Info */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900 dark:text-amber-200">
                      Überprüfen Sie die Daten und passen Sie sie bei Bedarf an, bevor Sie die Ausgabe erstellen.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 justify-end border-t pt-4">
          {suggestion ? (
            <>
              <Button
                variant="outline"
                onClick={() => setSuggestion(null)}
              >
                Neue Rechnung scannen
              </Button>
              <Button onClick={handleAcceptSuggestion}>
                Daten übernehmen & Ausgabe erstellen
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
