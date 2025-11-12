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
    .eq('month', monthDate)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching monthly plans with therapies:', error)
    return []
  }

  return data || []
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

  const { data, error } = await supabase
    .from('monthly_plans')
    .select(`
      planned_sessions,
      therapy_types (
        price_per_session
      )
    `)
    .eq('user_id', DEMO_USER_ID)
    .eq('month', monthDate)

  if (error) {
    console.error('Error calculating revenue:', error)
    return 0
  }

  return (data || []).reduce((total, plan: any) => {
    const revenue = plan.planned_sessions * (plan.therapy_types?.price_per_session || 0)
    return total + revenue
  }, 0)
}
