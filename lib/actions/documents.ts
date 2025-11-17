'use server'

import { createClient } from '@/utils/supabase/server'
import type { ExpenseDocument } from '@/lib/types'

export async function uploadExpenseDocument(
  expenseId: string,
  fileData: {
    name: string
    content: Buffer
    type: string
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (fileData.content.length > MAX_FILE_SIZE) {
      return { error: 'Datei ist zu groß (Maximum: 10MB)' }
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'image/webp',
      'image/jpg'
    ]
    if (!allowedTypes.includes(fileData.type)) {
      return { error: 'Dateityp nicht unterstützt. Erlaubt: JPG, PNG, PDF, WebP' }
    }

    // Generate unique file path
    const timestamp = Date.now()
    const fileName = `${user.id}/${expenseId}/${timestamp}_${fileData.name}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('expense-documents')
      .upload(fileName, fileData.content, {
        contentType: fileData.type,
        upsert: false
      })

    if (uploadError) {
      return { error: `Upload-Fehler: ${uploadError.message}` }
    }

    // Create document record in database
    const { data, error: dbError } = await supabase
      .from('expense_documents')
      .insert({
        user_id: user.id,
        expense_id: expenseId,
        file_name: fileData.name,
        file_path: fileName,
        file_size: fileData.content.length,
        file_type: fileData.type,
        storage_bucket: 'expense-documents'
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file on database error
      await supabase.storage
        .from('expense-documents')
        .remove([fileName])
      return { error: `Datenbankfehler: ${dbError.message}` }
    }

    return { data }
  } catch (error) {
    console.error('Error uploading document:', error)
    return { error: 'Ein unerwarteter Fehler ist aufgetreten' }
  }
}

export async function getExpenseDocuments(expenseId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return []
    }

    const { data, error } = await supabase
      .from('expense_documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('expense_id', expenseId)
      .order('upload_date', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return []
    }

    return data as ExpenseDocument[]
  } catch (error) {
    console.error('Error in getExpenseDocuments:', error)
    return []
  }
}

export async function deleteExpenseDocument(documentId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Get document to find file path
    const { data: document, error: fetchError } = await supabase
      .from('expense_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !document) {
      return { error: 'Dokument nicht gefunden' }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('expense-documents')
      .remove([document.file_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue with database deletion even if storage delete fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('expense_documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (dbError) {
      return { error: `Fehler beim Löschen: ${dbError.message}` }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting document:', error)
    return { error: 'Ein unerwarteter Fehler ist aufgetreten' }
  }
}

export async function getDocumentDownloadUrl(documentId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    const { data: document, error: fetchError } = await supabase
      .from('expense_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !document) {
      return { error: 'Dokument nicht gefunden' }
    }

    const { data } = await supabase.storage
      .from('expense-documents')
      .getPublicUrl(document.file_path)

    return { url: data.publicUrl }
  } catch (error) {
    console.error('Error getting download URL:', error)
    return { error: 'Ein unerwarteter Fehler ist aufgetreten' }
  }
}

/**
 * Parse bill image and extract expense data using OCR
 * This is called after client-side OCR extraction for final processing
 */
export async function parseBillImage(
  imageBase64: string,
  extractedText: string
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Import OCR utilities for text parsing
    const { parseInvoiceText, suggestCategory } = await import('@/lib/ocr-utils')

    // Parse the extracted text to find invoice details
    const parsed = parseInvoiceText(extractedText)

    // Suggest category based on text content
    const categoryHint = suggestCategory(parsed.vendor_name || '', extractedText)

    // Set default date if not found
    const invoiceDate = parsed.invoice_date || new Date().toISOString().split('T')[0]

    return {
      data: {
        vendor_name: parsed.vendor_name || 'Unbekannter Anbieter',
        invoice_date: invoiceDate,
        amount: parsed.amount || 0,
        currency: parsed.currency || 'EUR',
        description: extractedText.split('\n').slice(0, 3).join(' ').substring(0, 200),
        category_hint: categoryHint,
        raw_text: extractedText
      }
    }
  } catch (error) {
    console.error('Error parsing bill:', error)
    return {
      data: {
        vendor_name: 'Unbekannter Anbieter',
        invoice_date: new Date().toISOString().split('T')[0],
        amount: 0,
        currency: 'EUR',
        description: '',
        category_hint: 'Sonstiges',
        raw_text: ''
      }
    }
  }
}
