'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { MonthlyPlanSchema, type MonthlyPlanInput } from '@/lib/validations'
import type { MonthlyPlan } from '@/lib/types'

/**
 * Create or update a monthly plan for a therapy type
 */
export async function upsertMonthlyPlanAction(input: MonthlyPlanInput) {
  const supabase = await createClient()

  // Use demo/default user ID for public access (no authentication required)
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

  try {
    console.log('[upsertMonthlyPlanAction] Starting with input:', input)

    const validated = MonthlyPlanSchema.parse(input)
    console.log('[upsertMonthlyPlanAction] Validation passed:', validated)

    // Convert YYYY-MM to YYYY-MM-01 for date column
    const monthDate = validated.month.includes('-') && validated.month.length === 7
      ? `${validated.month}-01`
      : validated.month
    console.log('[upsertMonthlyPlanAction] Month conversion:', validated.month, '->', monthDate)

    // Check if therapy type exists and belongs to user
    console.log('[upsertMonthlyPlanAction] Checking therapy type:', validated.therapy_type_id)
    const { data: therapy, error: therapyError } = await supabase
      .from('therapy_types')
      .select('id')
      .eq('id', validated.therapy_type_id)
      .eq('user_id', DEMO_USER_ID)
      .single()

    console.log('[upsertMonthlyPlanAction] Therapy check result:', { therapy, therapyError })

    if (therapyError || !therapy) {
      console.log('[upsertMonthlyPlanAction] Therapy not found or no permission')
      return { error: 'Therapieart nicht gefunden oder keine Berechtigung' }
    }

    // Try to find existing plan
    console.log('[upsertMonthlyPlanAction] Checking for existing plan')
    const { data: existing, error: existingError } = await supabase
      .from('monthly_plans')
      .select('id')
      .eq('therapy_type_id', validated.therapy_type_id)
      .eq('month', monthDate)
      .eq('user_id', DEMO_USER_ID)
      .single()

    console.log('[upsertMonthlyPlanAction] Existing plan check:', { existing, existingError })

    let data, error

    if (existing) {
      // Update existing
      console.log('[upsertMonthlyPlanAction] Updating existing plan:', existing.id)
      const result = await supabase
        .from('monthly_plans')
        .update({
          planned_sessions: validated.planned_sessions,
          actual_sessions: validated.actual_sessions || null,
          notes: validated.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .eq('user_id', DEMO_USER_ID)
        .select()

      console.log('[upsertMonthlyPlanAction] Update result:', { data: result.data, error: result.error })
      data = result.data
      error = result.error
    } else {
      // Create new
      console.log('[upsertMonthlyPlanAction] Creating new plan with data:', {
        user_id: DEMO_USER_ID,
        therapy_type_id: validated.therapy_type_id,
        month: monthDate,
        planned_sessions: validated.planned_sessions,
        actual_sessions: validated.actual_sessions,
        notes: validated.notes
      })

      const result = await supabase
        .from('monthly_plans')
        .insert({
          user_id: DEMO_USER_ID,
          therapy_type_id: validated.therapy_type_id,
          month: monthDate,
          planned_sessions: validated.planned_sessions,
          actual_sessions: validated.actual_sessions || null,
          notes: validated.notes || null
        })
        .select()

      console.log('[upsertMonthlyPlanAction] Insert result:', { data: result.data, error: result.error })
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('[upsertMonthlyPlanAction] Database error:', error)
      return { error: 'Fehler beim Speichern. Bitte versuchen Sie es später.', details: error }
    }

    console.log('[upsertMonthlyPlanAction] Save successful, data:', data)

    // Revalidate cache
    revalidatePath('/dashboard/planung')

    return { success: true, data }
  } catch (error) {
    console.error('[upsertMonthlyPlanAction] Catch block error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Validierungsfehler' }
  }
}

/**
 * Get monthly plans for a specific month
 */
export async function getMonthlyPlans(month: string): Promise<MonthlyPlan[]> {
  const supabase = await createClient()

  // Use demo/default user ID for public access (no authentication required)
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  const { data, error } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .eq('month', monthDate)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching monthly plans:', error)
    return []
  }

  return data || []
}

/**
 * Get all monthly plans with therapy details
 */
export async function getMonthlyPlansWithTherapies(month: string) {
  const supabase = await createClient()

  // Use demo/default user ID for public access (no authentication required)
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  // Fetch monthly plans
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .eq('month', monthDate)
    .order('created_at', { ascending: true })

  if (plansError) {
    console.error('Error fetching monthly plans with therapies:', plansError)
    return []
  }

  if (!plans || plans.length === 0) {
    return []
  }

  // Fetch therapy types
  const { data: therapies, error: therapiesError } = await supabase
    .from('therapy_types')
    .select('*')
    .eq('user_id', DEMO_USER_ID)

  if (therapiesError) {
    console.error('Error fetching therapy types:', therapiesError)
    return []
  }

  // Create a map of therapies by ID for fast lookup
  const therapyMap = new Map(
    (therapies || []).map(t => [t.id, t])
  )

  // Join plans with therapies
  const result = plans.map(plan => ({
    ...plan,
    therapy_types: therapyMap.get(plan.therapy_type_id)
  }))

  return result
}

/**
 * Delete a monthly plan
 */
export async function deleteMonthlyPlanAction(id: string) {
  const supabase = await createClient()

  // Use demo/default user ID for public access (no authentication required)
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

  try {
    // Delete from database
    const { error } = await supabase
      .from('monthly_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', DEMO_USER_ID)

    if (error) {
      console.error('Database error:', error)
      return { error: 'Fehler beim Löschen. Bitte versuchen Sie es später.' }
    }

    // Revalidate cache
    revalidatePath('/dashboard/planung')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Ein Fehler ist aufgetreten' }
  }
}
