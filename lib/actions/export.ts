'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@/utils/supabase/service-client'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

/**
 * Export all expenses as a ZIP file containing:
 * - Excel file with expense data
 * - Subfolder with all bills (PDF, JPG, PNG files)
 */
export async function exportExpensesAction() {
  const supabase = await createClient()

  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Fetch all expenses for the user
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false })

    if (expensesError) {
      return { error: `Fehler beim Abrufen der Ausgaben: ${expensesError.message}` }
    }

    if (!expenses || expenses.length === 0) {
      return { error: 'Keine Ausgaben zum Exportieren vorhanden' }
    }

    // Fetch all documents for the user (use service role to bypass schema cache)
    const serviceSupabase = await createServiceClient()
    let documents: any[] | null = null

    // Try RPC first, fall back to direct query
    const { data: rpcDocs, error: rpcDocsError } = await serviceSupabase.rpc('get_all_user_documents', {
      p_user_id: user.id
    })
    if (rpcDocsError) {
      // Fall back to direct table query
      const { data: directDocs, error: directDocsError } = await serviceSupabase
        .from('expense_documents')
        .select('*')
        .eq('user_id', user.id)

      if (directDocsError) {
        console.error('Fehler beim Abrufen der Dokumente:', directDocsError)
      } else {
        documents = directDocs
      }
    } else {
      documents = rpcDocs
    }

    // Create ZIP file
    const zip = new JSZip()

    // Group expenses by month
    const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

    const expensesByMonth: Record<string, typeof expenses> = {}
    for (const expense of expenses) {
      const date = new Date(expense.expense_date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!expensesByMonth[key]) expensesByMonth[key] = []
      expensesByMonth[key].push(expense)
    }

    // Sort month keys chronologically
    const sortedMonthKeys = Object.keys(expensesByMonth).sort()

    const formatExpenseRow = (expense: typeof expenses[0]) => ({
      'Datum': expense.expense_date ? format(new Date(expense.expense_date), 'dd.MM.yyyy', { locale: de }) : '',
      'Kategorie': expense.category || '',
      'Unterkategorie': expense.subcategory || '',
      'Beschreibung': expense.description || '',
      'Betrag': expense.amount ? `€ ${expense.amount.toFixed(2)}` : '',
      'Wiederkehrend': expense.is_recurring ? 'Ja' : 'Nein',
      'Wiederholungsintervall': expense.recurrence_interval || '',
    })

    const columnWidths = [
      { wch: 12 }, // Datum
      { wch: 15 }, // Kategorie
      { wch: 15 }, // Unterkategorie
      { wch: 20 }, // Beschreibung
      { wch: 12 }, // Betrag
      { wch: 10 }, // Wiederkehrend
      { wch: 15 }, // Wiederholungsintervall
    ]

    const workbook = XLSX.utils.book_new()

    // Create one sheet per month
    for (const monthKey of sortedMonthKeys) {
      const monthExpenses = expensesByMonth[monthKey]
      const [year, month] = monthKey.split('-')
      const sheetName = `${MONTH_NAMES[parseInt(month) - 1]} ${year}`

      const excelData = monthExpenses.map(formatExpenseRow)
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      worksheet['!cols'] = columnWidths

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31))
    }

    // Also add a summary "Alle Ausgaben" sheet
    const allData = expenses.map(formatExpenseRow)
    const allSheet = XLSX.utils.json_to_sheet(allData)
    allSheet['!cols'] = columnWidths
    XLSX.utils.book_append_sheet(workbook, allSheet, 'Alle Ausgaben')

    // Convert workbook to buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    zip.file('Ausgaben.xlsx', Buffer.from(excelBuffer))

    // Add documents to ZIP
    if (documents && documents.length > 0) {
      const billsFolder = zip.folder('Belege')
      if (billsFolder) {
        for (const doc of documents) {
          try {
            // Download file from Supabase Storage (use service role to bypass storage RLS)
            const { data: fileData, error: downloadError } = await serviceSupabase
              .storage
              .from('expense-documents')
              .download(doc.file_path)

            if (downloadError || !fileData) {
              console.error(`Fehler beim Herunterladen von ${doc.file_path}:`, downloadError)
              continue
            }

            // Add file to bills folder with expense date prefix for sorting
            const matchingExpense = expenses.find(e => e.id === doc.expense_id)
            const datePrefix = matchingExpense?.expense_date
              ? format(new Date(matchingExpense.expense_date), 'yyyy-MM-dd')
              : ''
            const fileName = datePrefix
              ? `${datePrefix}_${doc.file_name}`
              : doc.file_name
            const arrayBuffer = await fileData.arrayBuffer()
            billsFolder.file(fileName, Buffer.from(arrayBuffer))
          } catch (error) {
            console.error(`Fehler beim Verarbeiten von Dokument ${doc.file_name}:`, error)
          }
        }
      }
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

    // Return ZIP file as base64 string
    const base64 = Buffer.from(zipBuffer).toString('base64')
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
    const filename = `Ausgaben_Export_${timestamp}.zip`

    return {
      success: true,
      data: {
        filename,
        content: base64,
      },
    }
  } catch (error) {
    console.error('Export error:', error)
    if (error instanceof Error) {
      return { error: `Fehler beim Exportieren: ${error.message}` }
    }
    return { error: 'Fehler beim Exportieren der Ausgaben' }
  }
}
