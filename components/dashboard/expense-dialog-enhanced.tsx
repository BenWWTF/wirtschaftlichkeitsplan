'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Receipt } from 'lucide-react'
import type { Expense } from '@/lib/types'
import { ExpenseFormEnhanced } from './expense-form-enhanced'
import { BillScanner, type BillScannerSuggestion } from './bill-scanner'

interface ExpenseDialogEnhancedProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
  onSuccess?: () => void
}

export function ExpenseDialogEnhanced({
  open,
  onOpenChange,
  expense,
  onSuccess
}: ExpenseDialogEnhancedProps) {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [suggestedData, setSuggestedData] = useState<BillScannerSuggestion | null>(null)

  const handleBillScannerSuggestion = (data: BillScannerSuggestion) => {
    setSuggestedData(data)
    setScannerOpen(false)
    // Automatically switch to manual entry tab to fill in the data
  }

  const handleSuccess = () => {
    setSuggestedData(null)
    onSuccess?.()
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {expense ? 'Ausgabe bearbeiten' : 'Neue Ausgabe erfassen'}
            </DialogTitle>
            <DialogDescription>
              {expense
                ? 'Aktualisieren Sie die Details dieser Ausgabe und verwalten Sie Dokumente.'
                : 'Erfassen Sie eine neue Betriebsausgabe oder scannen Sie eine Rechnung.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">
                Manuell erfassen
              </TabsTrigger>
              <TabsTrigger value="scan" disabled={!!expense}>
                <Receipt className="w-4 h-4 mr-2" />
                Rechnung scannen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <ExpenseFormEnhanced
                expense={expense || undefined}
                onSuccess={handleSuccess}
              />
            </TabsContent>

            <TabsContent value="scan" className="space-y-4">
              {!expense && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      📸 Laden Sie ein Foto oder PDF einer Rechnung hoch. Unser intelligentes System wird die Ausgabedaten automatisch extrahieren.
                    </p>
                  </div>

                  <Button
                    onClick={() => setScannerOpen(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Receipt className="w-5 h-5 mr-2" />
                    Rechnung hochladen & scannen
                  </Button>

                  {suggestedData && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-medium text-green-900 dark:text-green-200">
                        ✓ Rechnung erfolgreich analysiert
                      </p>
                      <div className="text-sm text-green-800 dark:text-green-300 space-y-1">
                        <p><strong>Anbieter:</strong> {suggestedData.vendor_name}</p>
                        <p><strong>Betrag:</strong> {suggestedData.amount} {suggestedData.currency}</p>
                        <p><strong>Datum:</strong> {suggestedData.invoice_date}</p>
                        <p><strong>Kategorie:</strong> {suggestedData.category_hint}</p>
                      </div>
                      <Button
                        onClick={() => setScannerOpen(true)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Neue Rechnung scannen
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <BillScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onSuggestion={handleBillScannerSuggestion}
      />
    </>
  )
}
