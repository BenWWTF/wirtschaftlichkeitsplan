'use server'

import { createClient } from '@/utils/supabase/server'
import * as XLSX from 'xlsx'

export interface LatidoInvoiceRow {
  rechnungsdatum: string
  rechnungsnummer: string
  zahlungsart: string
  gesamtbetrag_netto: number
  ust_10: number
  ust_13: number
  ust_20: number
  gesamtbetrag_brutto: number
  zahlungsstatus: string
  zahlungsdatum: string
  ordinationsdaten: string
  externe_transaktions_id: string | null
}

export interface ProcessedLatidoInvoice {
  invoice_number: string
  invoice_date: string
  payment_method: string
  net_amount: number
  vat_10_amount: number
  vat_13_amount: number
  vat_20_amount: number
  gross_amount: number
  payment_status: string
  payment_date: string | null
  practice_name: string | null
  practice_address: string | null
  external_transaction_id: string | null
}

/**
 * Parse Excel file buffer to JSON format
 */
export async function parseLatidoExcel(fileBuffer: Buffer): Promise<LatidoInvoiceRow[]> {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]

  if (!worksheet) {
    throw new Error('No worksheet found in Excel file')
  }

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    blankrows: false,
    defval: null,
  }) as (string | number | null)[][]

  if (rows.length < 2) {
    throw new Error('Excel file must contain header row and at least one data row')
  }

  // Parse header row and normalize column names
  const headerRow = rows[0] as string[]
  const normalizedHeaders = headerRow.map((h: string) =>
    h
      .toLowerCase()
      .replace(/[\s()%]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  )

  // Parse data rows
  const invoices: LatidoInvoiceRow[] = rows.slice(1).map((row: (string | number | null)[]) => {
    const invoice: any = {}
    normalizedHeaders.forEach((header, index) => {
      const value = row[index]
      // Convert numeric values to numbers
      if (typeof value === 'string' && !isNaN(Number(value.replace(/,/g, '.')))) {
        invoice[header] = Number(value.replace(/,/g, '.'))
      } else {
        invoice[header] = value
      }
    })
    return invoice as LatidoInvoiceRow
  })

  return invoices
}

/**
 * Validate and process Latido invoice rows
 */
export async function processLatidoInvoices(rows: LatidoInvoiceRow[]): Promise<ProcessedLatidoInvoice[]> {
  return rows.map((row) => {
    // Parse date from DD.MM.YYYY format
    const dateStr = row.rechnungsdatum
    const [day, month, year] = dateStr.split('.')
    const invoiceDateISO = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

    // Parse payment date if exists
    let paymentDateISO: string | null = null
    if (row.zahlungsdatum) {
      const [pDay, pMonth, pYear] = row.zahlungsdatum.split('.')
      paymentDateISO = `${pYear}-${pMonth.padStart(2, '0')}-${pDay.padStart(2, '0')}`
    }

    // Normalize payment status
    const normalizedStatus = row.zahlungsstatus.toLowerCase() === 'bezahlt' ? 'paid' : 'unpaid'

    // Parse practice details
    let practiceName: string | null = null
    let practiceAddress: string | null = null
    if (row.ordinationsdaten) {
      const [name, address] = row.ordinationsdaten.split('|').map((s) => s.trim())
      practiceName = name
      practiceAddress = address
    }

    return {
      invoice_number: String(row.rechnungsnummer),
      invoice_date: invoiceDateISO,
      payment_method: row.zahlungsart,
      net_amount: row.gesamtbetrag_netto || 0,
      vat_10_amount: row.ust_10 || 0,
      vat_13_amount: row.ust_13 || 0,
      vat_20_amount: row.ust_20 || 0,
      gross_amount: row.gesamtbetrag_brutto || 0,
      payment_status: normalizedStatus,
      payment_date: paymentDateISO,
      practice_name: practiceName,
      practice_address: practiceAddress,
      external_transaction_id: row.externe_transaktions_id || null,
    }
  })
}

/**
 * Import Latido invoices into database
 */
export async function importLatidoInvoices(userId: string, processedInvoices: ProcessedLatidoInvoice[], fileName: string) {
  const supabase = await createClient()

  try {
    // Create import session
    const { data: importSession, error: sessionError } = await supabase
      .from('latido_import_sessions')
      .insert({
        user_id: userId,
        file_name: fileName,
        total_invoices: processedInvoices.length,
      })
      .select()
      .single()

    if (sessionError) throw sessionError
    if (!importSession) throw new Error('Failed to create import session')

    // Insert invoices
    const { data: invoices, error: invoiceError } = await supabase
      .from('latido_invoices')
      .insert(
        processedInvoices.map((invoice) => ({
          user_id: userId,
          ...invoice,
          import_id: importSession.id,
        }))
      )
      .select()

    if (invoiceError) throw invoiceError

    // Update import session with success count
    const { error: updateError } = await supabase
      .from('latido_import_sessions')
      .update({
        successfully_imported: invoices?.length || 0,
        failed_imports: processedInvoices.length - (invoices?.length || 0),
      })
      .eq('id', importSession.id)

    if (updateError) throw updateError

    return {
      success: true,
      importSessionId: importSession.id,
      importedCount: invoices?.length || 0,
      totalCount: processedInvoices.length,
      invoices: invoices || [],
    }
  } catch (error) {
    console.error('Error importing Latido invoices:', error)
    throw error
  }
}

/**
 * Get imported invoices for a user
 */
export async function getLatidoInvoices(userId: string, month?: string) {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('latido_invoices')
      .select('*')
      .eq('user_id', userId)
      .order('invoice_date', { ascending: false })

    if (month) {
      query = query.gte('invoice_date', `${month}-01`).lte('invoice_date', `${month}-31`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching Latido invoices:', error)
    throw error
  }
}

/**
 * Get reconciliation summary
 */
export async function getLatidoReconciliationSummary(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc('get_latido_reconciliation_summary', {
      p_user_id: userId,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching reconciliation summary:', error)
    throw error
  }
}
