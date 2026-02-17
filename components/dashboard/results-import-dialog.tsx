'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LatidoImportForm } from './latido-import-form'

interface ResultsImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: (importedMonths?: string[]) => void
}

export function ResultsImportDialog({
  open,
  onOpenChange,
  onImportComplete
}: ResultsImportDialogProps) {
  const handleImportComplete = (importedMonths?: string[]) => {
    onOpenChange(false)
    onImportComplete?.(importedMonths)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ergebnisse importieren</DialogTitle>
          <DialogDescription>
            Importieren Sie tatsächliche Sitzungsdaten aus Ihrem Latido Excel-Export
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <LatidoImportForm onImportComplete={handleImportComplete} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
