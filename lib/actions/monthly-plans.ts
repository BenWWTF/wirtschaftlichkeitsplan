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
  const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000000'

  try {
    const validated = MonthlyPlanSchema.parse(input)

    // Check if therapy type exists and belongs to user
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
      .eq('month', validated.month)
      .eq('user_id', DEMO_USER_ID)
      .single()

    let data, error

    if (existing) {
      // Update existing
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

      data = result.data
      error = result.error
    } else {
      // Create new
      const result = await supabase
        .from('monthly_plans')
        .insert({
          user_id: DEMO_USER_ID,
          therapy_type_id: validated.therapy_type_id,
          month: validated.month,
          planned_sessions: validated.planned_sessions,
          actual_sessions: validated.actual_sessions || null,
          notes: validated.notes || null
        })
        .select()

      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Database error:', error)
      return { error: 'Fehler beim Speichern. Bitte versuchen Sie es später.' }
    }

    // Revalidate cache
    revalidatePath('/dashboard/planung')

    return { success: true, data }
  } catch (error) {
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
  const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000000'

  const { data, error } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .eq('month', month)
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
  const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000000'

  const { data, error } = await supabase
    .from('monthly_plans')
    .select(`
      *,
      therapy_types (
        id,
        name,
        price_per_session,
        variable_cost_per_session
      )
    `)
    .eq('user_id', DEMO_USER_ID)
    .eq('month', month)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching monthly plans with therapies:', error)
    return []
  }

  return data || []
}

/**
 * Delete a monthly plan
 */
export async function deleteMonthlyPlanAction(id: string) {
  const supabase = await createClient()

  // Use demo/default user ID for public access (no authentication required)
  const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000000'

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
