'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronDown, ChevronUp, Trash2, AlertCircle } from 'lucide-react'
import { getImportHistory, removeImportedInvoice, type ImportSession } from '@/lib/actions/import-history'
import { formatEuro } from '@/lib/utils'
import { toast } from 'sonner'

interface LatidoImportHistoryProps {
  onImportRemoved?: () => void
}

export function LatidoImportHistory({ onImportRemoved }: LatidoImportHistoryProps) {
  const [sessions, setSessions] = useState<ImportSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [removingInvoiceId, setRemovingInvoiceId] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const result = await getImportHistory()
      if (result.success) {
        setSessions(result.sessions)
      } else {
        toast.error(result.error || 'Fehler beim Laden der Importhistorie')
      }
    } catch (error) {
      console.error('Error loading import history:', error)
      toast.error('Fehler beim Laden der Importhistorie')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveInvoice = async (invoiceId: string) => {
    if (!window.confirm('Diesen Import wirklich rückgängig machen? Die tatsächlichen Sitzungen werden um 1 verringert.')) {
      return
    }

    setRemovingInvoiceId(invoiceId)
    try {
      const result = await removeImportedInvoice(invoiceId)
      if (result.success) {
        toast.success('Import rückgängig gemacht')
        await loadHistory()
        onImportRemoved?.()
      } else {
        toast.error(result.error || 'Fehler beim Rückgängigmachen')
      }
    } catch (error) {
      console.error('Error removing invoice:', error)
      toast.error('Fehler beim Rückgängigmachen des Imports')
    } finally {
      setRemovingInvoiceId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-neutral-100 dark:bg-neutral-700 h-12 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-6 text-center">
        <AlertCircle className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
        <p className="text-neutral-700 dark:text-neutral-300">Keine Importhistorie vorhanden</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Importe werden hier angezeigt</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map(session => (
        <div
          key={session.date}
          className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden"
        >
          {/* Session Header */}
          <button
            onClick={() => setExpandedSession(
              expandedSession === session.date ? null : session.date
            )}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
          >
            <div className="flex items-center gap-3 text-left">
              <Calendar className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">
                  {new Date(session.date).toLocaleDateString('de-DE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {session.invoice_count} Rechnungen • {formatEuro(session.total_amount)}
                </p>
              </div>
            </div>
            {expandedSession === session.date ? (
              <ChevronUp className="h-5 w-5 text-neutral-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-neutral-400" />
            )}
          </button>

          {/* Expanded Details */}
          {expandedSession === session.date && (
            <div className="border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/30">
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {session.invoices.map(invoice => (
                  <div key={invoice.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        {invoice.therapy_name || 'Unbekannte Therapieart'}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>{invoice.invoice_number}</span>
                        <span>{new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</span>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          {formatEuro(invoice.amount)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveInvoice(invoice.id)}
                      disabled={removingInvoiceId === invoice.id}
                      className="ml-4 p-2 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Diesen Import entfernen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
