'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthUserId } from '@/lib/utils/auth'
import { logError } from '@/lib/utils/logger'
import { MonthlyPlanSchema, type MonthlyPlanInput } from '@/lib/validations'
import type { MonthlyPlan, TherapyType } from '@/lib/types'

/**
 * Get all monthly plans for a specific month
 */
export async function getMonthlyPlans(month: string): Promise<MonthlyPlan[]> {
  // Handle null/undefined month - return empty array
  if (!month) {
    return []
  }

  const userId = await getAuthUserId()
  const supabase = await createClient()

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  const { data, error } = await supabase
    .from('monthly_plans')
    .select('id, user_id, therapy_type_id, month, planned_sessions, actual_sessions, notes, created_at, updated_at')
    .eq('user_id', userId)
    .eq('month', monthDate)
    .order('created_at', { ascending: false })

  if (error) {
    logError('getMonthlyPlans', 'Database error fetching monthly plans', error, { month })
    return []
  }

  return data || []
}

/**
 * Get monthly plans with therapy details
 */
export async function getMonthlyPlansWithTherapies(month: string) {
  // Handle null/undefined month - return empty array
  if (!month) {
    return []
  }

  const userId = await getAuthUserId()
  const supabase = await createClient()

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  // First fetch the monthly plans
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('id, user_id, therapy_type_id, month, planned_sessions, actual_sessions, notes, created_at, updated_at')
    .eq('user_id', userId)
    .eq('month', monthDate)
    .order('created_at', { ascending: false })

  if (plansError) {
    logError('getMonthlyPlansWithTherapies', 'Error fetching monthly plans with therapies', plansError, { month })
    return []
  }

  if (!plans || plans.length === 0) {
    return []
  }

  // Fetch therapy details separately
  const therapyTypeIds = [...new Set(plans.map(p => p.therapy_type_id))]

  if (therapyTypeIds.length === 0) {
    logError('getMonthlyPlansWithTherapies', 'No therapy type IDs found', new Error('Empty therapy type IDs'), { month })
    return plans.map(p => ({ ...p, therapy_types: null }))
  }

  const { data: therapies, error: therapiesError } = await supabase
    .from('therapy_types')
    .select('id, name, price_per_session, variable_cost_per_session')
    .in('id', therapyTypeIds)

  if (therapiesError) {
    logError('getMonthlyPlansWithTherapies', 'Error fetching therapy types', therapiesError, { month, therapyTypeIds })
    return plans.map(p => ({ ...p, therapy_types: null }))
  }

  // Combine manually - create a map of therapies by id
  const therapyMap = new Map(therapies?.map(t => [t.id, t]) || [])

  return plans.map(plan => ({
    ...plan,
    therapy_types: therapyMap.get(plan.therapy_type_id) || null
  }))
}

/**
 * Create or update a monthly plan
 */
export async function upsertMonthlyPlanAction(input: MonthlyPlanInput) {
  const userId = await getAuthUserId()
  const supabase = await createClient()

  try {
    const validated = MonthlyPlanSchema.parse(input)

    // Convert YYYY-MM to YYYY-MM-01 for date column
    const monthDate = validated.month.includes('-') && validated.month.length === 7
      ? `${validated.month}-01`
      : validated.month

    // Check if therapy type exists
    const { data: therapy, error: therapyError } = await supabase
      .from('therapy_types')
      .select('id')
      .eq('id', validated.therapy_type_id)
      .eq('user_id', userId)
      .single()

    if (therapyError || !therapy) {
      return { error: 'Therapieart nicht gefunden oder keine Berechtigung' }
    }

    // Try to find existing plan
    const { data: existing } = await supabase
      .from('monthly_plans')
      .select('id')
      .eq('therapy_type_id', validated.therapy_type_id)
      .eq('user_id', userId)
      .eq('month', monthDate)
      .single()

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('monthly_plans')
        .update({
          planned_sessions: validated.planned_sessions,
          actual_sessions: validated.actual_sessions,
          notes: validated.notes
        })
        .eq('id', existing.id)
        .select('id, updated_at')

      if (error) {
        return { error: `Fehler beim Aktualisieren: ${error.message}` }
      }

      revalidatePath('/dashboard/planung')
      return { success: true, data }
    } else {
      // Create new
      const { data, error } = await supabase
        .from('monthly_plans')
        .insert({
          user_id: userId,
          therapy_type_id: validated.therapy_type_id,
          month: monthDate,
          planned_sessions: validated.planned_sessions,
          actual_sessions: validated.actual_sessions,
          notes: validated.notes
        })
        .select('id, created_at')

      if (error) {
        return { error: `Fehler beim Erstellen: ${error.message}` }
      }

      revalidatePath('/dashboard/planung')
      return { success: true, data }
    }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Validierungsfehler' }
  }
}

/**
 * Delete a monthly plan
 */
export async function deleteMonthlyPlanAction(id: string) {
  const userId = await getAuthUserId()
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('monthly_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      return { error: `Fehler beim Löschen: ${error.message}` }
    }

    revalidatePath('/dashboard/planung')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Löschen' }
  }
}

/**
 * Copy plans from previous month if current month has no plans
 * Called automatically when selecting a new month without plans
 */
export async function copyPlansFromPreviousMonthAction(month: string) {
  const userId = await getAuthUserId()
  const supabase = await createClient()

  try {
    // Convert YYYY-MM to YYYY-MM-01 for date column
    const monthDate = month.includes('-') && month.length === 7
      ? `${month}-01`
      : month

    // Check if current month already has plans
    const { data: existingPlans } = await supabase
      .from('monthly_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('month', monthDate)
      .limit(1)

    if (existingPlans && existingPlans.length > 0) {
      // Month already has plans, don't copy
      return { success: false, message: 'Month already has plans' }
    }

    // Calculate previous month
    const [year, monthNum] = month.split('-')
    let prevYear = parseInt(year)
    let prevMonth = parseInt(monthNum) - 1

    if (prevMonth < 1) {
      prevMonth = 12
      prevYear--
    }

    const previousMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
    const previousMonthDate = `${previousMonth}-01`

    // Get plans from previous month
    const { data: previousPlans, error: fetchError } = await supabase
      .from('monthly_plans')
      .select('therapy_type_id, planned_sessions, notes')
      .eq('user_id', userId)
      .eq('month', previousMonthDate)

    if (fetchError) {
      logError('copyPlansFromPreviousMonthAction', 'Error fetching previous month plans', fetchError, { month, previousMonth })
      return { error: `Fehler beim Abrufen der Vormonats-Pläne: ${fetchError.message}` }
    }

    if (!previousPlans || previousPlans.length === 0) {
      return { success: false, message: 'No plans in previous month to copy' }
    }

    // Create new plans for current month based on previous month
    const newPlans = previousPlans.map(plan => ({
      user_id: userId,
      therapy_type_id: plan.therapy_type_id,
      month: monthDate,
      planned_sessions: plan.planned_sessions,
      actual_sessions: null,
      notes: plan.notes
    }))

    const { error: insertError } = await supabase
      .from('monthly_plans')
      .insert(newPlans)

    if (insertError) {
      logError('copyPlansFromPreviousMonthAction', 'Error copying plans to current month', insertError, { month })
      return { error: `Fehler beim Kopieren: ${insertError.message}` }
    }

    revalidatePath('/dashboard/planung')
    return { success: true, copied: previousPlans.length }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Kopieren der Pläne' }
  }
}
