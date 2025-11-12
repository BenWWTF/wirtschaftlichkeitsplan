'use server'

import { createClient } from '@/utils/supabase/server'
import type { TherapyType, MonthlyPlan } from '@/lib/types'

export interface MonthlyMetrics {
  month: string
  planned_sessions: number
  actual_sessions: number
  planned_revenue: number
  actual_revenue: number
  total_expenses: number
  planned_margin: number
  actual_margin: number
  profitability: number
}

export interface TherapyMetrics {
  therapy_id: string
  therapy_name: string
  price_per_session: number
  variable_cost_per_session: number
  contribution_margin: number
  total_planned_sessions: number
  total_actual_sessions: number
  total_revenue: number
  total_margin: number
  profitability_percent: number
}

export interface DashboardSummary {
  total_revenue: number
  total_expenses: number
  net_income: number
  total_sessions: number
  average_session_price: number
  profitability_rate: number
  break_even_status: 'surplus' | 'breakeven' | 'deficit'
}

/**
 * Get monthly metrics for a specific month
 */
export async function getMonthlyMetrics(month: string): Promise<MonthlyMetrics | null> {
  const supabase = await createClient()

  // Use demo/default user ID for public access (no authentication required)
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

  // Get monthly plans first
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('id, planned_sessions, actual_sessions, therapy_type_id')
    .eq('user_id', DEMO_USER_ID)
    .eq('month', month)

  if (plansError || !plans) {
    console.error('Error fetching monthly plans:', plansError)
    return null
  }

  // Fetch therapy types
  const therapyTypeIds = [...new Set(plans.map(p => p.therapy_type_id))]
  const { data: therapies, error: therapiesError } = await supabase
    .from('therapy_types')
    .select('id, price_per_session, variable_cost_per_session')
    .in('id', therapyTypeIds)

  if (therapiesError) {
    console.error('Error fetching therapy types:', therapiesError)
    return null
  }

  const therapyMap = Object.fromEntries(
    (therapies || []).map(t => [t.id, t])
  )

  // Get monthly expenses
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', DEMO_USER_ID)

  if (expensesError) {
    console.error('Error fetching expenses:', expensesError)
  }

  // Calculate metrics
  let totalPlannedSessions = 0
  let totalActualSessions = 0
  let totalPlannedRevenue = 0
  let totalActualRevenue = 0
  let totalPlannedMargin = 0
  let totalActualMargin = 0

  for (const plan of plans) {
    const therapy = therapyMap[(plan.therapy_type_id as string)]
    const plannedRevenue = plan.planned_sessions * therapy.price_per_session
    const actualRevenue = (plan.actual_sessions || 0) * therapy.price_per_session
    const plannedMargin =
      plan.planned_sessions *
      (therapy.price_per_session - therapy.variable_cost_per_session)
    const actualMargin =
      (plan.actual_sessions || 0) *
      (therapy.price_per_session - therapy.variable_cost_per_session)

    totalPlannedSessions += plan.planned_sessions
    totalActualSessions += plan.actual_sessions || 0
    totalPlannedRevenue += plannedRevenue
    totalActualRevenue += actualRevenue
    totalPlannedMargin += plannedMargin
    totalActualMargin += actualMargin
  }

  // Calculate total expenses for this month
  const monthlyExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0

  const profitability = totalActualMargin - monthlyExpenses

  return {
    month,
    planned_sessions: totalPlannedSessions,
    actual_sessions: totalActualSessions,
    planned_revenue: totalPlannedRevenue,
    actual_revenue: totalActualRevenue,
    total_expenses: monthlyExpenses,
    planned_margin: totalPlannedMargin,
    actual_margin: totalActualMargin,
    profitability
  }
}

/**
 * Get metrics for multiple months
 */
export async function getMonthlyMetricsRange(
  startMonth: string,
  endMonth: string
): Promise<MonthlyMetrics[]> {
  const supabase = await createClient()

  // Use demo/default user ID for public access (no authentication required)
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

  // Get all monthly plans in range
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('month, planned_sessions, actual_sessions, therapy_type_id')
    .eq('user_id', DEMO_USER_ID)
    .gte('month', startMonth)
    .lte('month', endMonth)
    .order('month', { ascending: true })

  if (plansError || !plans) {
    console.error('Error fetching monthly plans:', plansError)
    return []
  }

  // Fetch therapy types
  const therapyTypeIds = [...new Set(plans.map(p => p.therapy_type_id))]
  const { data: therapies, error: therapiesError } = await supabase
    .from('therapy_types')
    .select('id, price_per_session, variable_cost_per_session')
    .in('id', therapyTypeIds)

  if (therapiesError) {
    console.error('Error fetching therapy types:', therapiesError)
    return []
  }

  const therapyMap = Object.fromEntries(
    (therapies || []).map(t => [t.id, t])
  )

  // Get all expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, expense_date')
    .eq('user_id', DEMO_USER_ID)

  // Group by month
  const monthlyData: Record<string, MonthlyMetrics> = {}

  for (const plan of plans) {
    const month = plan.month
    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        planned_sessions: 0,
        actual_sessions: 0,
        planned_revenue: 0,
        actual_revenue: 0,
        total_expenses: 0,
        planned_margin: 0,
        actual_margin: 0,
        profitability: 0
      }
    }

    const therapy = therapyMap[(plan.therapy_type_id as string)]
    const plannedRevenue = plan.planned_sessions * therapy.price_per_session
    const actualRevenue = (plan.actual_sessions || 0) * therapy.price_per_session
    const plannedMargin =
      plan.planned_sessions *
      (therapy.price_per_session - therapy.variable_cost_per_session)
    const actualMargin =
      (plan.actual_sessions || 0) *
      (therapy.price_per_session - therapy.variable_cost_per_session)

    monthlyData[month].planned_sessions += plan.planned_sessions
    monthlyData[month].actual_sessions += plan.actual_sessions || 0
    monthlyData[month].planned_revenue += plannedRevenue
    monthlyData[month].actual_revenue += actualRevenue
    monthlyData[month].planned_margin += plannedMargin
    monthlyData[month].actual_margin += actualMargin
  }

  // Add expenses
  if (expenses) {
    for (const expense of expenses) {
      const expenseMonth = new Date(expense.expense_date)
        .toISOString()
        .slice(0, 7)
      if (monthlyData[expenseMonth]) {
        monthlyData[expenseMonth].total_expenses += expense.amount
      }
    }
  }

  // Calculate profitability
  for (const month in monthlyData) {
    monthlyData[month].profitability =
      monthlyData[month].actual_margin - monthlyData[month].total_expenses
  }

  return Object.values(monthlyData).sort((a, b) =>
    a.month.localeCompare(b.month)
  )
}

/**
 * Get therapy-specific metrics
 */
export async function getTherapyMetrics(): Promise<TherapyMetrics[]> {
  const supabase = await createClient()

  // Use demo/default user ID for public access (no authentication required)
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

  // Get all therapies
  const { data: therapies, error: therapiesError } = await supabase
    .from('therapy_types')
    .select('*')
    .eq('user_id', DEMO_USER_ID)

  if (therapiesError || !therapies) {
    console.error('Error fetching therapies:', therapiesError)
    return []
  }

  // Get all monthly plans
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('therapy_type_id, planned_sessions, actual_sessions')
    .eq('user_id', DEMO_USER_ID)

  if (plansError) {
    console.error('Error fetching plans:', plansError)
  }

  // Calculate metrics per therapy
  const therapyMetrics: TherapyMetrics[] = therapies.map((therapy: TherapyType) => {
    const therapyPlans = (plans || []).filter(
      (p) => p.therapy_type_id === therapy.id
    )

    const totalPlannedSessions = therapyPlans.reduce(
      (sum, p) => sum + p.planned_sessions,
      0
    )
    const totalActualSessions = therapyPlans.reduce(
      (sum, p) => sum + (p.actual_sessions || 0),
      0
    )
    const totalRevenue =
      totalActualSessions * therapy.price_per_session
    const totalMargin =
      totalActualSessions *
      (therapy.price_per_session - therapy.variable_cost_per_session)
    const profitabilityPercent =
      totalPlannedSessions > 0
        ? (totalActualSessions / totalPlannedSessions) * 100
        : 0

    return {
      therapy_id: therapy.id,
      therapy_name: therapy.name,
      price_per_session: therapy.price_per_session,
      variable_cost_per_session: therapy.variable_cost_per_session,
      contribution_margin:
        therapy.price_per_session - therapy.variable_cost_per_session,
      total_planned_sessions: totalPlannedSessions,
      total_actual_sessions: totalActualSessions,
      total_revenue: totalRevenue,
      total_margin: totalMargin,
      profitability_percent: profitabilityPercent
    }
  })

  return therapyMetrics
}

/**
 * Get overall dashboard summary
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient()

  // Use demo/default user ID for public access (no authentication required)
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

  // Get therapy metrics
  const therapyMetrics = await getTherapyMetrics()

  // Get all expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', DEMO_USER_ID)

  const totalRevenue = therapyMetrics.reduce((sum, t) => sum + t.total_revenue, 0)
  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
  const totalSessions = therapyMetrics.reduce(
    (sum, t) => sum + t.total_actual_sessions,
    0
  )
  const averageSessionPrice =
    totalSessions > 0 ? totalRevenue / totalSessions : 0
  const netIncome = totalRevenue - totalExpenses
  const profitabilityRate =
    totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0

  const breakEvenStatus: 'surplus' | 'breakeven' | 'deficit' =
    netIncome > 0 ? 'surplus' : netIncome === 0 ? 'breakeven' : 'deficit'

  return {
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    net_income: netIncome,
    total_sessions: totalSessions,
    average_session_price: averageSessionPrice,
    profitability_rate: profitabilityRate,
    break_even_status: breakEvenStatus
  }
}
