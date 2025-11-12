import { createClient } from '@/utils/supabase/server'
import type { MonthlyPlan } from '@/lib/types'

/**
 * Get all monthly plans for a specific month
 */
export async function getMonthlyPlans(month: string): Promise<MonthlyPlan[]> {
  const supabase = await createClient()
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  console.log('[getMonthlyPlans] Querying for month:', monthDate, 'user_id:', DEMO_USER_ID)

  const { data, error } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .eq('month', monthDate)
    .order('created_at', { ascending: false })

  console.log('[getMonthlyPlans] Query result:', { data, error })

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
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

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
    // Return plans with null therapy_types to avoid crashes
    return plans.map(p => ({ ...p, therapy_types: null }))
  }

  if (!therapies || therapies.length === 0) {
    console.warn('[getMonthlyPlansWithTherapies] No therapy types returned from database')
    return plans.map(p => ({ ...p, therapy_types: null }))
  }

  // Combine data
  const therapyMap = Object.fromEntries(
    therapies.map(t => [t.id, t])
  )

  return plans.map(plan => ({
    ...plan,
    therapy_types: therapyMap[plan.therapy_type_id] || null
  }))
}

/**
 * Get all months that have plans
 */
export async function getPlannedMonths(): Promise<string[]> {
  const supabase = await createClient()
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

  const { data, error } = await supabase
    .from('monthly_plans')
    .select('month')
    .eq('user_id', DEMO_USER_ID)
    .order('month', { ascending: false })

  if (error) {
    console.error('Error fetching planned months:', error)
    return []
  }

  return data?.map(p => p.month) || []
}

/**
 * Calculate monthly revenue for a specific month
 */
export async function calculateMonthlyRevenue(month: string): Promise<number> {
  const supabase = await createClient()
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('planned_sessions, therapy_type_id')
    .eq('user_id', DEMO_USER_ID)
    .eq('month', monthDate)

  if (plansError) {
    console.error('Error calculating revenue:', plansError)
    return 0
  }

  if (!plans || plans.length === 0) {
    return 0
  }

  // Fetch therapy details
  const therapyTypeIds = [...new Set(plans.map(p => p.therapy_type_id))]
  const { data: therapies } = await supabase
    .from('therapy_types')
    .select('id, price_per_session')
    .in('id', therapyTypeIds)

  const therapyMap = Object.fromEntries(
    (therapies || []).map(t => [t.id, t])
  )

  return plans.reduce((total, plan: any) => {
    const therapy = therapyMap[plan.therapy_type_id]
    const revenue = plan.planned_sessions * (therapy?.price_per_session || 0)
    return total + revenue
  }, 0)
}
