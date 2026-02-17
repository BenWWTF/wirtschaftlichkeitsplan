'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@/utils/supabase/service-client'
import type { ExpenseDocument } from '@/lib/types'

export async function uploadExpenseDocument(
  expenseId: string,
  fileData: {
    name: string
    content: string
    type: string
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Convert base64 to Buffer
    const buffer = Buffer.from(fileData.content, 'base64')

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (buffer.length > MAX_FILE_SIZE) {
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

    // Use service role client for storage upload (bypasses storage RLS)
    const serviceSupabase = await createServiceClient()

    const { error: uploadError } = await serviceSupabase.storage
      .from('expense-documents')
      .upload(fileName, buffer, {
        contentType: fileData.type,
        upsert: false
      })

    if (uploadError) {
      return { error: `Upload-Fehler: ${uploadError.message}` }
    }

    // Create document record via RPC (bypasses PostgREST schema cache for table)
    const { data, error: dbError } = await serviceSupabase.rpc('insert_expense_document', {
      p_user_id: user.id,
      p_expense_id: expenseId,
      p_file_name: fileData.name,
      p_file_path: fileName,
      p_file_size: buffer.length,
      p_file_type: fileData.type,
      p_storage_bucket: 'expense-documents'
    })

    if (dbError) {
      // Clean up uploaded file on database error
      console.error('Database insert failed:', dbError.message)
      await serviceSupabase.storage
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

    // Use service role client to bypass PostgREST schema cache issues
    const serviceSupabase = await createServiceClient()

    // Try RPC first, fall back to direct query
    const { data, error } = await serviceSupabase.rpc('get_expense_documents', {
      p_user_id: user.id,
      p_expense_id: expenseId
    })

    if (error) {
      // RPC not in schema cache yet - try direct table query with service role
      console.error('RPC get_expense_documents not available, trying direct query:', error.code)
      const { data: directData, error: directError } = await serviceSupabase
        .from('expense_documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('expense_id', expenseId)
        .order('upload_date', { ascending: false })

      if (directError) {
        console.error('Direct query also failed:', directError.message)
        return []
      }
      return (directData || []) as ExpenseDocument[]
    }

    return (data || []) as ExpenseDocument[]
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

    const serviceSupabase = await createServiceClient()

    // Get document file path
    let filePath: string | null = null

    // Try RPC first
    const { data: rpcPath, error: rpcError } = await serviceSupabase.rpc('get_expense_document_path', {
      p_document_id: documentId,
      p_user_id: user.id
    })

    if (rpcError) {
      // Fall back to direct query
      const { data: doc, error: docError } = await serviceSupabase
        .from('expense_documents')
        .select('file_path')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single()

      if (docError || !doc) {
        return { error: 'Dokument nicht gefunden' }
      }
      filePath = doc.file_path
    } else {
      filePath = rpcPath
    }

    if (!filePath) {
      return { error: 'Dokument nicht gefunden' }
    }

    // Delete from storage
    const { error: storageError } = await serviceSupabase.storage
      .from('expense-documents')
      .remove([filePath])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }

    // Delete from database - try RPC first
    const { error: rpcDeleteError } = await serviceSupabase.rpc('delete_expense_document', {
      p_document_id: documentId,
      p_user_id: user.id
    })

    if (rpcDeleteError) {
      // Fall back to direct delete
      const { error: dbError } = await serviceSupabase
        .from('expense_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id)

      if (dbError) {
        return { error: `Fehler beim Löschen: ${dbError.message}` }
      }
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

    const serviceSupabase = await createServiceClient()

    // Get file path - try RPC first, fall back to direct query
    let filePath: string | null = null

    const { data: rpcPath, error: rpcError } = await serviceSupabase.rpc('get_expense_document_path', {
      p_document_id: documentId,
      p_user_id: user.id
    })

    if (rpcError) {
      const { data: doc, error: docError } = await serviceSupabase
        .from('expense_documents')
        .select('file_path')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single()

      if (docError || !doc) {
        return { error: 'Dokument nicht gefunden' }
      }
      filePath = doc.file_path
    } else {
      filePath = rpcPath
    }

    if (!filePath) {
      return { error: 'Dokument nicht gefunden' }
    }

    // Use createSignedUrl for secure, time-limited access (1 hour expiry)
    const { data, error: signError } = await serviceSupabase.storage
      .from('expense-documents')
      .createSignedUrl(filePath, 3600)

    if (signError) {
      console.error('Error creating signed URL:', signError)
      return { error: 'Fehler beim Generieren des Download-Links' }
    }

    return { url: data.signedUrl }
  } catch (error) {
    console.error('Error getting download URL:', error)
    return { error: 'Ein unerwarteter Fehler ist aufgetreten' }
  }
}

/**
 * Parse bill image and extract expense data using OCR
 */
export async function parseBillImage(
  _imageBase64: string | null,
  extractedText: string
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    const { parseInvoiceText, suggestCategory, debugExtractedText } = await import('@/lib/invoice-parsing')

    console.log('Raw extracted text length:', extractedText.length)
    debugExtractedText(extractedText)

    const parsed = parseInvoiceText(extractedText)
    const categoryHint = suggestCategory(parsed.vendor_name || '', extractedText)
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
