'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader } from 'lucide-react'
import { exportExpensesAction } from '@/lib/actions/export'
import { toast } from 'sonner'

/**
 * Export Expenses Button Component
 *
 * Allows users to export all expenses as a ZIP file containing:
 * - Excel spreadsheet with all expense data
 * - Folder with all uploaded bills (PDFs, images)
 */
export function ExportExpensesButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    setIsLoading(true)
    try {
      toast.loading('Exportiere Ausgaben...')

      const result = await exportExpensesAction()

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (!result.success || !result.data) {
        toast.error('Export fehlgeschlagen')
        return
      }

      // Decode base64 and create blob
      const binaryString = atob(result.data.content)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'application/zip' })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.data.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Export erfolgreich!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Fehler beim Exportieren der Ausgaben')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading}
      variant="outline"
      size="sm"
      title="Exportiere alle Ausgaben als ZIP-Datei mit Excel und Rechnungen"
    >
      {isLoading ? (
        <>
          <Loader className="w-4 h-4 mr-2 animate-spin" />
          Wird exportiert...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Exportieren
        </>
      )}
    </Button>
  )
}
