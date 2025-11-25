'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Eye, Trash2, FileText, Image as ImageIcon, File } from 'lucide-react'
import type { ExpenseDocument } from '@/lib/types'
import { deleteExpenseDocument } from '@/lib/actions/documents'
import { toast } from 'sonner'

interface DocumentViewerProps {
  documents: ExpenseDocument[]
  onDocumentsChange?: () => void
}

export function DocumentViewer({ documents, onDocumentsChange }: DocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<ExpenseDocument | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />
    }
    if (fileType === 'application/pdf') {
      return <FileText className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Möchten Sie dieses Dokument wirklich löschen?')) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteExpenseDocument(documentId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Dokument erfolgreich gelöscht')
        setSelectedDocument(null)
        onDocumentsChange?.()
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Fehler beim Löschen des Dokuments')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = (doc: ExpenseDocument) => {
    // In a real app, you would fetch the signed download URL from the server
    // For now, we'll construct the public URL
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const url = `${baseUrl}/storage/v1/object/public/expense-documents/${doc.file_path}`

    const link = document.createElement('a')
    link.href = url
    link.download = doc.file_name
    link.click()
  }

  if (documents.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Angehängte Dokumente ({documents.length})
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex-shrink-0 text-neutral-400">
                  {getFileIcon(document.file_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {document.file_name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatFileSize(document.file_size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setSelectedDocument(document)}
                  className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  title="Vorschau anzeigen"
                >
                  <Eye className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
                <button
                  onClick={() => handleDownload(document)}
                  className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  title="Herunterladen"
                >
                  <Download className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="break-words">
              {selectedDocument?.file_name}
            </DialogTitle>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                <span>
                  Größe: {formatFileSize(selectedDocument.file_size)}
                </span>
                <span>
                  Hochgeladen: {new Date(selectedDocument.upload_date).toLocaleDateString('de-DE')}
                </span>
              </div>

              {/* Document Preview */}
              <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-4 min-h-[400px] flex items-center justify-center overflow-auto">
                {selectedDocument.file_type.startsWith('image/') ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/expense-documents/${selectedDocument.file_path}`}
                    alt={selectedDocument.file_name}
                    width={500}
                    height={500}
                    className="max-w-full max-h-[500px] rounded"
                  />
                ) : selectedDocument.file_type === 'application/pdf' ? (
                  <div className="text-center text-neutral-500 dark:text-neutral-400">
                    <FileText className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>PDF-Vorschau nicht verfügbar</p>
                    <p className="text-sm mt-2">Klicken Sie auf &quot;Herunterladen&quot; um die Datei zu öffnen</p>
                  </div>
                ) : (
                  <div className="text-center text-neutral-500 dark:text-neutral-400">
                    <File className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>Vorschau für diesen Dateityp nicht verfügbar</p>
                  </div>
                )}
              </div>

              {/* Extracted Text */}
              {selectedDocument.extracted_text && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Erkannter Text
                  </p>
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded p-3 max-h-[200px] overflow-y-auto text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap break-words">
                    {selectedDocument.extracted_text}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedDocument)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Herunterladen
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedDocument.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Wird gelöscht...' : 'Löschen'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
