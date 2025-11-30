'use server'

import { createClient } from '@/utils/supabase/server'
import type { TherapyType } from '@/lib/types'

export interface ResultsRow {
  id: string
  therapy_type_id: string
  therapy_name: string
  price_per_session: number
  planned_sessions: number
  actual_sessions: number | null
  variance: number
  variancePercent: number
  achievement: number
  planned_revenue: number
  actual_revenue: number
}

/**
 * Get monthly results with planned vs actual comparison
 */
export async function getMonthlyResultsWithTherapies(month: string): Promise<ResultsRow[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[getMonthlyResultsWithTherapies] Authentication error:', authError)
    return []
  }

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  // Fetch monthly plans for the month
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', monthDate)
    .order('created_at', { ascending: false })

  if (plansError) {
    console.error('[getMonthlyResultsWithTherapies] Error fetching monthly plans:', plansError)
    return []
  }

  if (!plans || plans.length === 0) {
    return []
  }

  // Fetch therapy details
  const therapyTypeIds = [...new Set(plans.map(p => p.therapy_type_id))]

  if (therapyTypeIds.length === 0) {
    return []
  }

  const { data: therapies, error: therapiesError } = await supabase
    .from('therapy_types')
    .select('id, name, price_per_session')
    .in('id', therapyTypeIds)

  if (therapiesError) {
    console.error('[getMonthlyResultsWithTherapies] Error fetching therapy types:', therapiesError)
    return []
  }

  // Create therapy map
  const therapyMap = new Map(therapies?.map(t => [t.id, t]) || [])

  // Calculate results rows with variance and achievement
  const results = plans.map(plan => {
    const therapy = therapyMap.get(plan.therapy_type_id)
    if (!therapy) return null

    const planned = plan.planned_sessions || 0
    const actual = plan.actual_sessions || 0
    const variance = actual - planned
    const variancePercent = planned > 0
      ? Math.round((variance / planned) * 100)
      : 0
    const achievement = planned > 0
      ? Math.round((actual / planned) * 100)
      : (actual > 0 ? 100 : 0)
    const planned_revenue = planned * therapy.price_per_session
    const actual_revenue = actual * therapy.price_per_session

    return {
      id: plan.id,
      therapy_type_id: plan.therapy_type_id,
      therapy_name: therapy.name,
      price_per_session: therapy.price_per_session,
      planned_sessions: planned,
      actual_sessions: actual,
      variance,
      variancePercent,
      achievement,
      planned_revenue,
      actual_revenue
    } as ResultsRow
  }).filter((row): row is ResultsRow => row !== null)

  return results
}

/**
 * Calculate aggregate metrics for a month
 */
export async function calculateMonthlyMetrics(month: string) {
  const results = await getMonthlyResultsWithTherapies(month)

  const totalPlanned = results.reduce((sum, r) => sum + r.planned_sessions, 0)
  const totalActual = results.reduce((sum, r) => sum + (r.actual_sessions || 0), 0)
  const totalPlannedRevenue = results.reduce((sum, r) => sum + r.planned_revenue, 0)
  const totalActualRevenue = results.reduce((sum, r) => sum + r.actual_revenue, 0)
  const overallAchievement = totalPlanned > 0
    ? Math.round((totalActual / totalPlanned) * 100)
    : (totalActual > 0 ? 100 : 0)

  return {
    totalPlanned,
    totalActual,
    overallAchievement,
    totalPlannedRevenue,
    totalActualRevenue,
    totalVariance: totalActual - totalPlanned,
    totalVariancePercent: totalPlanned > 0
      ? Math.round(((totalActual - totalPlanned) / totalPlanned) * 100)
      : 0
  }
}

/**
 * Update actual sessions for a therapy in a month
 */
export async function updateActualSessions(
  therapy_type_id: string,
  month: string,
  actual_sessions: number
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentifizierung erforderlich' }
  }

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  // Find existing plan
  const { data: existingPlan, error: fetchError } = await supabase
    .from('monthly_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('therapy_type_id', therapy_type_id)
    .eq('month', monthDate)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    return { error: 'Fehler beim Abrufen des Plans' }
  }

  if (existingPlan) {
    // Update existing plan
    const { error: updateError } = await supabase
      .from('monthly_plans')
      .update({ actual_sessions })
      .eq('id', existingPlan.id)

    if (updateError) {
      return { error: 'Fehler beim Aktualisieren der Sitzungen' }
    }
  } else {
    // Create new plan with actual_sessions only
    const { error: insertError } = await supabase
      .from('monthly_plans')
      .insert({
        user_id: user.id,
        therapy_type_id,
        month: monthDate,
        planned_sessions: 0,
        actual_sessions
      })

    if (insertError) {
      return { error: 'Fehler beim Erstellen des Plans' }
    }
  }

  return { success: true }
}
