'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { MonthlyPlanSchema, type MonthlyPlanInput } from '@/lib/validations'
import type { MonthlyPlan, TherapyType } from '@/lib/types'

/**
 * Get all monthly plans for a specific month
 */
export async function getMonthlyPlans(month: string): Promise<MonthlyPlan[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  // Use demo user if no authenticated user
  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  const { data, error } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('user_id', userId)
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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  // Use demo user if no authenticated user
  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  // First fetch the monthly plans
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('user_id', userId)
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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentifizierung fehlgeschlagen' }
  }

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
      .eq('user_id', user.id)
      .single()

    if (therapyError || !therapy) {
      return { error: 'Therapieart nicht gefunden oder keine Berechtigung' }
    }

    // Try to find existing plan
    const { data: existing } = await supabase
      .from('monthly_plans')
      .select('id')
      .eq('therapy_type_id', validated.therapy_type_id)
      .eq('user_id', user.id)
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
          user_id: user.id,
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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentifizierung fehlgeschlagen' }
  }

  try {
    const { error } = await supabase
      .from('monthly_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

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
 * Copy monthly plans from one month to multiple future months
 */
export async function copyMonthlyPlansAction(input: {
  fromMonth: string
  toMonths: number
}) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentifizierung fehlgeschlagen' }
  }

  try {
    // Get the source month's plans
    const sourceMonth = input.fromMonth.includes('-') && input.fromMonth.length === 7
      ? `${input.fromMonth}-01`
      : input.fromMonth

    const { data: sourcePlans, error: sourceError } = await supabase
      .from('monthly_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', sourceMonth)

    if (sourceError || !sourcePlans) {
      return { error: `Fehler beim Abrufen der Quellpläne: ${sourceError?.message}` }
    }

    // Generate target months
    const [year, month] = input.fromMonth.split('-').map(Number)
    const targetMonths = []

    for (let i = 1; i <= input.toMonths; i++) {
      let targetMonth = month + i
      let targetYear = year

      while (targetMonth > 12) {
        targetMonth -= 12
        targetYear += 1
      }

      const monthStr = String(targetMonth).padStart(2, '0')
      targetMonths.push(`${targetYear}-${monthStr}-01`)
    }

    // Copy plans to each target month
    const newPlans = []
    for (const targetMonth of targetMonths) {
      for (const plan of sourcePlans) {
        newPlans.push({
          user_id: user.id,
          therapy_type_id: plan.therapy_type_id,
          month: targetMonth,
          planned_sessions: plan.planned_sessions,
          actual_sessions: plan.actual_sessions,
          notes: plan.notes
        })
      }
    }

    if (newPlans.length === 0) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from('monthly_plans')
      .insert(newPlans)
      .select()

    if (error) {
      return { error: `Fehler beim Kopieren: ${error.message}` }
    }

    revalidatePath('/dashboard/planung')
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Fehler beim Kopieren der Pläne' }
  }
}
