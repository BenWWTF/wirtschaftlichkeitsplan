'use client'

import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'

interface ImportResult {
  success: boolean
  importSessionId: string
  importedCount: number
  totalCount: number
  invoices: any[]
}

export function LatidoImportForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<ImportResult | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setSuccess(null)

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload an Excel file (.xlsx or .xls)')
      return
    }

    // Validate file size
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File is too large. Maximum size is 5MB')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/latido/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to import invoices')
        return
      }

      setSuccess(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during import')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
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

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-12 text-center transition ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
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

        <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {isLoading ? 'Uploading...' : 'Drop your Latido export here'}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          or click to select an Excel file (.xlsx, .xls)
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Maximum file size: 5MB
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
          <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-3">
            Successfully imported {success.importedCount} of {success.totalCount} invoices
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-green-700 dark:text-green-300 font-medium">Imported</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">{success.importedCount}</p>
            </div>
            <div>
              <p className="text-green-700 dark:text-green-300 font-medium">Total</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">{success.totalCount}</p>
            </div>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-3">
            Session ID: {success.importSessionId}
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <span className="font-semibold">How it works:</span> Upload your Latido billing export file to import invoices.
          Your invoices will be matched against your therapy sessions for reconciliation.
        </p>
      </div>

      {/* Sample Data Info */}
      <div className="rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Expected file format:
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>" Column 1: Rechnungsdatum (Invoice Date)</li>
          <li>" Column 2: Rechnungsnummer (Invoice Number)</li>
          <li>" Column 3: Zahlungsart (Payment Method)</li>
          <li>" Columns 4-7: Net amount and VAT breakdown (10%, 13%, 20%)</li>
          <li>" Column 8: Gesamtbetrag Brutto (Gross Amount)</li>
          <li>" Column 9: Zahlungsstatus (Payment Status)</li>
          <li>" Column 10: Zahlungsdatum (Payment Date)</li>
          <li>" Column 11: Ordinationsdaten (Practice Details)</li>
          <li>" Column 12: Externe Transaktions-ID (External Transaction ID)</li>
        </ul>
      </div>
    </div>
  )
}
