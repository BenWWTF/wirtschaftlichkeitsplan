'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { ExpenseSchema, type ExpenseInput } from '@/lib/validations'
import type { Expense } from '@/lib/types'

/**
 * Create a new expense
 */
export async function createExpenseAction(input: ExpenseInput) {
  const supabase = await createClient()

  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    const validated = ExpenseSchema.parse(input)

    // Insert into database
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        category: validated.category,
        subcategory: validated.subcategory || null,
        amount: validated.amount,
        expense_date: validated.expense_date,
        is_recurring: validated.is_recurring || false,
        recurrence_interval: validated.recurrence_interval || null,
        description: validated.description || null
      })
      .select()

    if (error) {
      console.error('Database error:', JSON.stringify(error, null, 2))
      return { error: `Fehler: ${error.message || 'Speichern fehlgeschlagen'}` }
    }

    if (!data || data.length === 0) {
      return { error: 'Ausgabe konnte nicht erstellt werden' }
    }

    // Revalidate cache - invalidate all related pages
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/ausgaben')
    revalidatePath('/dashboard/berichte')
    revalidatePath('/dashboard/analyse')

    return { success: true, data: data[0] }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Validierungsfehler' }
  }
}

/**
 * Update an existing expense
 */
export async function updateExpenseAction(
  id: string,
  input: ExpenseInput
) {
  const supabase = await createClient()

  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    const validated = ExpenseSchema.parse(input)

    // Update in database
    const { data, error } = await supabase
      .from('expenses')
      .update({
        category: validated.category,
        subcategory: validated.subcategory || null,
        amount: validated.amount,
        expense_date: validated.expense_date,
        is_recurring: validated.is_recurring || false,
        recurrence_interval: validated.recurrence_interval || null,
        description: validated.description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()

    if (error) {
      console.error('Database error:', JSON.stringify(error, null, 2))
      return { error: `Fehler: ${error.message || 'Aktualisieren fehlgeschlagen'}` }
    }

    if (!data || data.length === 0) {
      return { error: 'Ausgabe nicht gefunden oder keine Berechtigung' }
    }

    // Revalidate cache
    revalidatePath('/dashboard/ausgaben')
    revalidatePath('/dashboard/berichte')
    revalidatePath('/dashboard/analyse')

    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Validierungsfehler' }
  }
}

/**
 * Delete an expense
 */
export async function deleteExpenseAction(id: string) {
  const supabase = await createClient()

  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Authentifizierung erforderlich' }
    }

    // Delete from database
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', JSON.stringify(error, null, 2))
      return { error: `Fehler: ${error.message || 'Löschen fehlgeschlagen'}` }
    }

    // Revalidate cache - invalidate all related pages
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/ausgaben')
    revalidatePath('/dashboard/berichte')
    revalidatePath('/dashboard/analyse')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Ein Fehler ist aufgetreten' }
  }
}

/**
 * Get all expenses for current user (for use in server components)
 */
export async function getExpenses(): Promise<Expense[]> {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    // Use demo user if no authenticated user
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('expense_date', { ascending: false })

    if (error) {
      console.error('Supabase error fetching expenses:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception fetching expenses:', err)
    return []
  }
}

/**
 * Get expenses filtered by date range
 */
export async function getExpensesByDateRange(
  startDate: string,
  endDate: string
): Promise<Expense[]> {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return []
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false })

    if (error) {
      console.error('Supabase error fetching expenses by date range:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception fetching expenses by date range:', err)
    return []
  }
}

/**
 * Get expenses by category
 */
export async function getExpensesByCategory(category: string): Promise<Expense[]> {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return []
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', category)
      .order('expense_date', { ascending: false })

    if (error) {
      console.error('Supabase error fetching expenses by category:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception fetching expenses by category:', err)
    return []
  }
}

/**
 * Get total expenses for a given month
 */
export async function getMonthlyExpenseTotal(month: string): Promise<number> {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return 0
    }

    // Calculate month boundaries (month is in YYYY-MM format)
    const startDate = `${month}-01`
    const endDate = new Date(parseInt(month.slice(0, 4)), parseInt(month.slice(5, 7)), 0)
      .toISOString()
      .slice(0, 10)

    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)

    if (error) {
      console.error('Supabase error calculating monthly expense total:', error)
      return 0
    }

    const total = (data || []).reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
    return total
  } catch (err) {
    console.error('Exception calculating monthly expense total:', err)
    return 0
  }
}
