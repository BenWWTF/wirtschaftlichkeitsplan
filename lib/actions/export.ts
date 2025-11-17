'use server'

import { createClient } from '@/utils/supabase/server'
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

    // Fetch all documents for the user
    const { data: documents, error: documentsError } = await supabase
      .from('expense_documents')
      .select('*')
      .eq('user_id', user.id)

    if (documentsError) {
      console.error('Fehler beim Abrufen der Dokumente:', documentsError)
    }

    // Create ZIP file
    const zip = new JSZip()

    // Prepare expenses data for Excel
    const excelData = expenses.map((expense) => ({
      'Datum': expense.expense_date ? format(new Date(expense.expense_date), 'dd.MM.yyyy', { locale: de }) : '',
      'Kategorie': expense.category || '',
      'Unterkategorie': expense.subcategory || '',
      'Beschreibung': expense.description || '',
      'Betrag': expense.amount ? `€ ${expense.amount.toFixed(2)}` : '',
      'Wiederkehrend': expense.is_recurring ? 'Ja' : 'Nein',
      'Wiederholungsintervall': expense.recurrence_interval || '',
      'Erstellt am': expense.created_at ? format(new Date(expense.created_at), 'dd.MM.yyyy HH:mm', { locale: de }) : '',
    }))

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const columnWidths = [
      { wch: 12 }, // Datum
      { wch: 15 }, // Kategorie
      { wch: 15 }, // Unterkategorie
      { wch: 20 }, // Beschreibung
      { wch: 12 }, // Betrag
      { wch: 10 }, // Wiederkehrend
      { wch: 15 }, // Wiederholungsintervall
      { wch: 18 }, // Erstellt am
    ]
    worksheet['!cols'] = columnWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ausgaben')

    // Convert workbook to buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    zip.file('Ausgaben.xlsx', Buffer.from(excelBuffer))

    // Add documents to ZIP
    if (documents && documents.length > 0) {
      const billsFolder = zip.folder('Rechnungen')
      if (billsFolder) {
        for (const doc of documents) {
          try {
            // Download file from Supabase Storage
            const { data: fileData, error: downloadError } = await supabase
              .storage
              .from('expense-documents')
              .download(`${user.id}/${doc.storage_path}`)

            if (downloadError || !fileData) {
              console.error(`Fehler beim Herunterladen von ${doc.storage_path}:`, downloadError)
              continue
            }

            // Add file to bills folder
            const fileName = doc.storage_path.split('/').pop() || doc.original_filename
            billsFolder.file(fileName, fileData)
          } catch (error) {
            console.error(`Fehler beim Verarbeiten von Dokument ${doc.original_filename}:`, error)
            // Continue with other documents
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
