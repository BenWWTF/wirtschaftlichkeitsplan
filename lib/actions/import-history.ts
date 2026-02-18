'use server'

import { createClient } from '@/utils/supabase/server'

export interface ImportRecord {
  id: string
  invoice_number: string
  invoice_date: string
  amount: number
  therapy_type_id: string
  therapy_name?: string
  created_at: string
}

export interface ImportSession {
  date: string
  invoice_count: number
  total_amount: number
  invoices: ImportRecord[]
}

/**
 * Get import history grouped by import date
 * Shows what was imported, when, and for which therapies
 */
export async function getImportHistory() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return {
      success: false,
      sessions: [],
      error: 'Authentication required'
    }
  }

  try {
    // Fetch imported invoices with therapy type names
    const { data, error } = await supabase
      .from('imported_invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        amount,
        therapy_type_id,
        created_at,
        therapy_types:therapy_type_id(name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return {
        success: false,
        sessions: [],
        error: error.message
      }
    }

    // Group by created_at date (group imports that happened on same day)
    const sessions = new Map<string, ImportSession>()

    for (const record of data || []) {
      const createdDate = record.created_at.split('T')[0] // YYYY-MM-DD

      if (!sessions.has(createdDate)) {
        sessions.set(createdDate, {
          date: createdDate,
          invoice_count: 0,
          total_amount: 0,
          invoices: []
        })
      }

      const session = sessions.get(createdDate)!
      session.invoice_count++
      session.total_amount += record.amount

      const therapyType = Array.isArray(record.therapy_types)
        ? record.therapy_types[0]
        : record.therapy_types

      session.invoices.push({
        id: record.id,
        invoice_number: record.invoice_number,
        invoice_date: record.invoice_date,
        amount: record.amount,
        therapy_type_id: record.therapy_type_id,
        therapy_name: (therapyType as any)?.name || 'Unbekannt',
        created_at: record.created_at
      })
    }

    return {
      success: true,
      sessions: Array.from(sessions.values()).sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
      error: null
    }
  } catch (err) {
    return {
      success: false,
      sessions: [],
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Remove an imported invoice (reverses the import for that invoice)
 * Updates monthly_plans if this was the last invoice for that month/therapy
 */
export async function removeImportedInvoice(invoiceId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Authentication required' }
  }

  try {
    // Get the invoice record
    const { data: invoice, error: fetchError } = await supabase
      .from('imported_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError || !invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    // Extract month from invoice_date
    const invoiceMonth = invoice.invoice_date.slice(0, 7) + '-01'

    // Update monthly_plans: decrement actual_sessions
    const { data: plan, error: planError } = await supabase
      .from('monthly_plans')
      .select('id, actual_sessions')
      .eq('user_id', user.id)
      .eq('therapy_type_id', invoice.therapy_type_id)
      .eq('month', invoiceMonth)
      .maybeSingle()

    if (plan) {
      const newActual = Math.max(0, (plan.actual_sessions || 1) - 1)
      await supabase
        .from('monthly_plans')
        .update({ actual_sessions: newActual })
        .eq('id', plan.id)
    }

    // Delete the imported invoice record
    const { error: deleteError } = await supabase
      .from('imported_invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('user_id', user.id)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}
