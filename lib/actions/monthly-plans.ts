'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { MonthlyPlanSchema, type MonthlyPlanInput } from '@/lib/validations'
import type { MonthlyPlan, TherapyType } from '@/lib/types'

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Get all monthly plans for a specific month
 */
export async function getMonthlyPlans(month: string): Promise<MonthlyPlan[]> {
  const supabase = await createClient()

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  const { data, error } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .eq('month', monthDate)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getMonthlyPlans] Database error:', error)
    return []
  }

  return data || []
}

/**
 * Get monthly plans with therapy details
 */
export async function getMonthlyPlansWithTherapies(month: string) {
  const supabase = await createClient()

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  // First fetch the monthly plans
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .eq('month', monthDate)
    .order('created_at', { ascending: false })

  if (plansError) {
    console.error('Error fetching monthly plans with therapies:', plansError)
    return []
  }

  if (!plans || plans.length === 0) {
    return []
  }

  // Fetch therapy details separately
  const therapyTypeIds = [...new Set(plans.map(p => p.therapy_type_id))]

  if (therapyTypeIds.length === 0) {
    console.warn('[getMonthlyPlansWithTherapies] No therapy type IDs found')
    return plans.map(p => ({ ...p, therapy_types: null }))
  }

  const { data: therapies, error: therapiesError } = await supabase
    .from('therapy_types')
    .select('id, name, price_per_session, variable_cost_per_session')
    .in('id', therapyTypeIds)

  if (therapiesError) {
    console.error('[getMonthlyPlansWithTherapies] Error fetching therapy types:', therapiesError)
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
      .eq('user_id', DEMO_USER_ID)
      .single()

    if (therapyError || !therapy) {
      return { error: 'Therapieart nicht gefunden oder keine Berechtigung' }
    }

    // Try to find existing plan
    const { data: existing } = await supabase
      .from('monthly_plans')
      .select('id')
      .eq('therapy_type_id', validated.therapy_type_id)
      .eq('user_id', DEMO_USER_ID)
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
        .select()

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
          user_id: DEMO_USER_ID,
          therapy_type_id: validated.therapy_type_id,
          month: monthDate,
          planned_sessions: validated.planned_sessions,
          actual_sessions: validated.actual_sessions,
          notes: validated.notes
        })
        .select()

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
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('monthly_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', DEMO_USER_ID)

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
