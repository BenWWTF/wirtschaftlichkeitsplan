'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface LatidoInvoice {
  id: string
  invoice_number: string
  invoice_date: string
  payment_method: string
  gross_amount: number
  payment_status: string
  reconciled: boolean
}

interface ReconciliationSummary {
  total_invoices: number
  total_amount: number
  reconciled_count: number
  unreconciled_count: number
  discrepancy_total: number
  payment_status_summary: string
}

export function LatidoReconciliation() {
  const [invoices, setInvoices] = useState<LatidoInvoice[]>([])
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReconciliationData()
  }, [])

  const loadReconciliationData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [invoicesRes, summaryRes] = await Promise.all([
        fetch('/api/latido/invoices'),
        fetch('/api/latido/reconciliation-summary'),
      ])

      if (!invoicesRes.ok || !summaryRes.ok) {
        throw new Error('Failed to load reconciliation data')
      }

      const invoicesData = await invoicesRes.json()
      const summaryData = await summaryRes.json()

      setInvoices(invoicesData)
      setSummary(summaryData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'unpaid':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getReconciliationStatus = (invoice: LatidoInvoice) => {
    if (invoice.reconciled) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3" />
          Matched
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <AlertCircle className="h-3 w-3" />
        Unmatched
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
        <p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Invoices</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.total_invoices}</p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {Math.abs(summary.total_amount).toFixed(2)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Reconciled</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.reconciled_count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {summary.total_invoices > 0
                ? ((summary.reconciled_count / summary.total_invoices) * 100).toFixed(0)
                : 0}%
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Discrepancies</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {Math.abs(summary.discrepancy_total).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {summary && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Status Summary</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{summary.payment_status_summary}</p>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Imported Invoices</h3>
        </div>

        {invoices.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No invoices imported yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">Amount</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">Payment Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">Reconciliation</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {invoice.gross_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.payment_status)}`}>
                        {invoice.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getReconciliationStatus(invoice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
