'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@/utils/supabase/service-client'
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
  // Use range filter to handle potential date format variations
  const nextMonth = new Date(Number(monthDate.split('-')[0]), Number(monthDate.split('-')[1]), 1)
  const nextMonthDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`

  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('user_id', user.id)
    .gte('month', monthDate)
    .lt('month', nextMonthDate)
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
  // Include plans with deleted therapy types using fallback name
  const results = plans.map(plan => {
    const therapy = therapyMap.get(plan.therapy_type_id)
    const therapyName = therapy?.name || 'Gelöschte Therapieart'
    const pricePerSession = therapy?.price_per_session || 0

    const planned = plan.planned_sessions || 0
    const actual = plan.actual_sessions || 0
    const variance = actual - planned
    const variancePercent = planned > 0
      ? Math.round((variance / planned) * 100)
      : 0
    const achievement = planned > 0
      ? Math.round((actual / planned) * 100)
      : (actual > 0 ? 100 : 0)
    const planned_revenue = planned * pricePerSession
    const actual_revenue = actual * pricePerSession

    return {
      id: plan.id,
      therapy_type_id: plan.therapy_type_id,
      therapy_name: therapyName,
      price_per_session: pricePerSession,
      planned_sessions: planned,
      actual_sessions: actual,
      variance,
      variancePercent,
      achievement,
      planned_revenue,
      actual_revenue
    } as ResultsRow
  })

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

/**
 * Get months that have monthly_plans data for the current user
 * Returns array of YYYY-MM strings
 */
export async function getMonthsWithData(): Promise<string[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return []

  const { data, error } = await supabase
    .from('monthly_plans')
    .select('month')
    .eq('user_id', user.id)

  if (error || !data) return []

  // Convert YYYY-MM-01 dates to YYYY-MM and deduplicate
  const months = new Set(
    data.map(row => {
      const d = String(row.month)
      // Handle both "2025-11-01" and "2025-11-01T00:00:00" formats
      return d.slice(0, 7)
    })
  )

  return [...months].sort()
}

/**
 * Reset/delete actual sessions for a therapy in a month
 * Also clears imported_invoices records for that month/therapy
 * If planned_sessions is also 0, deletes the monthly_plan row entirely
 */
export async function resetActualSessions(
  therapy_type_id: string,
  month: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentifizierung erforderlich' }
  }

  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  // Find existing plan
  const { data: existingPlan, error: fetchError } = await supabase
    .from('monthly_plans')
    .select('id, planned_sessions')
    .eq('user_id', user.id)
    .eq('therapy_type_id', therapy_type_id)
    .eq('month', monthDate)
    .single()

  if (fetchError) {
    return { error: 'Eintrag nicht gefunden' }
  }

  if (existingPlan.planned_sessions > 0) {
    // Has planned sessions - just reset actual to 0
    const { error: updateError } = await supabase
      .from('monthly_plans')
      .update({ actual_sessions: 0 })
      .eq('id', existingPlan.id)

    if (updateError) {
      return { error: 'Fehler beim Zurücksetzen' }
    }
  } else {
    // No planned sessions either - delete the row entirely
    const { error: deleteError } = await supabase
      .from('monthly_plans')
      .delete()
      .eq('id', existingPlan.id)

    if (deleteError) {
      return { error: 'Fehler beim Löschen' }
    }
  }

  // Clear imported_invoices for this month/therapy (so re-import is possible)
  try {
    const serviceSupabase = await createServiceClient()
    // Calculate month range for the date filter
    const monthStart = monthDate
    const [y, m] = monthDate.split('-')
    const nextMonth = new Date(Number(y), Number(m), 1)
    const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`

    await serviceSupabase
      .from('imported_invoices')
      .delete()
      .eq('user_id', user.id)
      .eq('therapy_type_id', therapy_type_id)
      .gte('invoice_date', monthStart)
      .lt('invoice_date', monthEnd)
  } catch {
    // Non-critical - imported_invoices table might not exist yet
  }

  return { success: true }
}

/**
 * Delete orphaned monthly_plans rows where the therapy_type no longer exists
 */
export async function cleanupOrphanedPlans(): Promise<{ deleted: number; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { deleted: 0, error: 'Authentifizierung erforderlich' }
  }

  // Get all user's plans
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('id, therapy_type_id')
    .eq('user_id', user.id)

  if (plansError || !plans) {
    return { deleted: 0, error: 'Fehler beim Abrufen der Pläne' }
  }

  // Get all existing therapy type IDs
  const { data: therapies, error: therapiesError } = await supabase
    .from('therapy_types')
    .select('id')
    .eq('user_id', user.id)

  if (therapiesError) {
    return { deleted: 0, error: 'Fehler beim Abrufen der Therapiearten' }
  }

  const existingIds = new Set(therapies?.map(t => t.id) || [])
  const orphanedIds = plans
    .filter(p => !existingIds.has(p.therapy_type_id))
    .map(p => p.id)

  if (orphanedIds.length === 0) {
    return { deleted: 0 }
  }

  const { error: deleteError } = await supabase
    .from('monthly_plans')
    .delete()
    .in('id', orphanedIds)

  if (deleteError) {
    return { deleted: 0, error: 'Fehler beim Löschen' }
  }

  return { deleted: orphanedIds.length }
}
