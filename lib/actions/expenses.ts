'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthUserId } from '@/lib/utils/auth'
import { logError } from '@/lib/utils/logger'
import { ExpenseSchema, type ExpenseInput } from '@/lib/validations'
import type { Expense } from '@/lib/types'

/**
 * Create a new expense
 */
export async function createExpenseAction(input: ExpenseInput) {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()
    const validated = ExpenseSchema.parse(input)

    // Insert into database
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
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
      logError('createExpenseAction', 'Database error while creating expense', error, {
        message: error.message,
        code: error.code,
        details: error.details
      })
      return { error: `Fehler: ${error.message || 'Speichern fehlgeschlagen'}` }
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
 * Update an existing expense
 */
export async function updateExpenseAction(
  id: string,
  input: ExpenseInput
) {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()
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
      .eq('user_id', userId)
      .select()

    if (error) {
      logError('updateExpenseAction', 'Database error while updating expense', error, {
        id,
        message: error.message,
        code: error.code
      })
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
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()

    // Delete from database
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      logError('deleteExpenseAction', 'Database error while deleting expense', error, { id })
      return { error: `Fehler: ${error.message || 'Löschen fehlgeschlagen'}` }
    }

    // Revalidate cache
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
    const userId = await getAuthUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('expense_date', { ascending: false })
      .limit(1000)

    if (error) {
      logError('getExpenses', 'Supabase error fetching expenses', error, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return []
    }

    return data || []
  } catch (err) {
    logError('getExpenses', 'Exception fetching expenses', err)
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
    const userId = await getAuthUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false })
      .limit(1000)

    if (error) {
      logError('getExpensesByDateRange', 'Supabase error fetching expenses by date range', error, { startDate, endDate })
      return []
    }

    return data || []
  } catch (err) {
    logError('getExpensesByDateRange', 'Exception fetching expenses by date range', err, { startDate, endDate })
    return []
  }
}

/**
 * Get expenses by category
 */
export async function getExpensesByCategory(category: string): Promise<Expense[]> {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('expense_date', { ascending: false })
      .limit(1000)

    if (error) {
      logError('getExpensesByCategory', 'Supabase error fetching expenses by category', error, { category })
      return []
    }

    return data || []
  } catch (err) {
    logError('getExpensesByCategory', 'Exception fetching expenses by category', err, { category })
    return []
  }
}

/**
 * Get total expenses for a given month
 */
export async function getMonthlyExpenseTotal(month: string): Promise<number> {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()

    // Calculate month boundaries (month is in YYYY-MM format)
    const startDate = `${month}-01`
    const endDate = new Date(parseInt(month.slice(0, 4)), parseInt(month.slice(5, 7)), 0)
      .toISOString()
      .slice(0, 10)

    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)

    if (error) {
      logError('getMonthlyExpenseTotal', 'Supabase error calculating monthly expense total', error, { month })
      return 0
    }

    const total = (data || []).reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
    return total
  } catch (err) {
    logError('getMonthlyExpenseTotal', 'Exception calculating monthly expense total', err, { month })
    return 0
  }
}
