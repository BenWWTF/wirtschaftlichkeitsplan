'use server'

import { createClient } from '@/utils/supabase/server'
import { getAuthUserId } from '@/lib/utils/auth'
import { logError } from '@/lib/utils/logger'
import type { TherapyType, MonthlyPlan } from '@/lib/types'
import { getPlannedMetrics } from '@/lib/metrics/planned-metrics'
import { getActualMetrics } from '@/lib/metrics/actual-metrics'
import { get12MonthHistory, type MonthlyHistory } from '@/lib/metrics/history-metrics'
import type { MetricsResult } from '@/lib/metrics/metrics-result'

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
  const userId = await getAuthUserId()
  const supabase = await createClient()

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  // Get monthly plans first
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('id, planned_sessions, actual_sessions, therapy_type_id')
    .eq('user_id', userId)
    .eq('month', monthDate)

  if (plansError || !plans) {
    logError('getMonthlyMetrics', 'Error fetching monthly plans', plansError)
    return null
  }

  // Fetch therapy types
  const therapyTypeIds = [...new Set(plans.map(p => p.therapy_type_id))]
  const { data: therapies, error: therapiesError } = await supabase
    .from('therapy_types')
    .select('id, price_per_session, variable_cost_per_session')
    .in('id', therapyTypeIds)

  if (therapiesError) {
    logError('getMonthlyMetrics', 'Error fetching therapy types', therapiesError)
    return null
  }

  const therapyMap = Object.fromEntries(
    (therapies || []).map(t => [t.id, t])
  )

  // Get monthly expenses
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)

  if (expensesError) {
    logError('getMonthlyMetrics', 'Error fetching expenses', expensesError, { month })
  }

  // Calculate metrics
  let totalPlannedSessions = 0
  let totalActualSessions = 0
  let totalPlannedRevenue = 0
  let totalActualRevenue = 0
  let totalPlannedMargin = 0
  let totalActualMargin = 0

  for (const plan of plans) {
    const therapyTypeId = String(plan.therapy_type_id)
    const therapy = therapyMap[therapyTypeId]
    if (!therapy) {
      logError('getMonthlyMetrics', 'Therapy not found', new Error('Missing therapy type'), { therapyTypeId })
      continue
    }

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
  const userId = await getAuthUserId()
  const supabase = await createClient()

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const startDate = startMonth.includes('-') && startMonth.length === 7
    ? `${startMonth}-01`
    : startMonth
  const endDate = endMonth.includes('-') && endMonth.length === 7
    ? `${endMonth}-01`
    : endMonth

  // Get all monthly plans in range
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('month, planned_sessions, actual_sessions, therapy_type_id')
    .eq('user_id', userId)
    .gte('month', startDate)
    .lte('month', endDate)
    .order('month', { ascending: true })

  if (plansError || !plans) {
    logError('getMonthlyMetricsRange', 'Error fetching monthly plans', plansError)
    return []
  }

  // Fetch therapy types
  const therapyTypeIds = [...new Set(plans.map(p => p.therapy_type_id))]
  const { data: therapies, error: therapiesError } = await supabase
    .from('therapy_types')
    .select('id, price_per_session, variable_cost_per_session')
    .in('id', therapyTypeIds)

  if (therapiesError) {
    logError('getMonthlyMetricsRange', 'Error fetching therapy types', therapiesError)
    return []
  }

  const therapyMap = Object.fromEntries(
    (therapies || []).map(t => [t.id, t])
  )

  // Get all expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, expense_date')
    .eq('user_id', userId)

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

    const therapyTypeId = String(plan.therapy_type_id)
    const therapy = therapyMap[therapyTypeId]
    if (!therapy) {
      logError('getMonthlyMetricsRange', 'Therapy not found', new Error('Missing therapy type'), { therapyTypeId })
      continue
    }

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
  const userId = await getAuthUserId()
  const supabase = await createClient()

  // Get all therapies
  const { data: therapies, error: therapiesError } = await supabase
    .from('therapy_types')
    .select('*')
    .eq('user_id', userId)
    .limit(500)

  if (therapiesError || !therapies) {
    logError('getTherapyMetrics', 'Error fetching therapies', therapiesError)
    return []
  }

  // Get all monthly plans
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('therapy_type_id, planned_sessions, actual_sessions')
    .eq('user_id', userId)
    .limit(5000)

  if (plansError) {
    logError('getTherapyMetrics', 'Error fetching plans', plansError)
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
  const userId = await getAuthUserId()
  const supabase = await createClient()

  // Get therapy metrics
  const therapyMetrics = await getTherapyMetrics()

  // Return default summary if no therapy metrics available
  if (!therapyMetrics || therapyMetrics.length === 0) {
    return {
      total_revenue: 0,
      total_expenses: 0,
      net_income: 0,
      total_sessions: 0,
      average_session_price: 0,
      profitability_rate: 0,
      break_even_status: 'deficit'
    }
  }

  // Get all expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .limit(10000)

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

/**
 * New unified dashboard metrics interface
 * Combines planned forecast with actual results and 12-month history
 */
export interface DashboardMetrics {
  month_year: string
  forecast: MetricsResult
  results: MetricsResult
  history_12_months: MonthlyHistory[]
  total_expenses: number
}

/**
 * Get comprehensive dashboard metrics including forecast and results
 * This is the new unified dashboard data fetcher
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const userId = await getAuthUserId()
  const supabase = await createClient()

  // Get current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7)

  try {
    // Fetch planned metrics, actual metrics, and history in parallel
    const [forecast, results, history] = await Promise.all([
      getPlannedMetrics(userId, currentMonth),
      getActualMetrics(userId, currentMonth),
      get12MonthHistory(userId, currentMonth)
    ])

    // Fetch total expenses for break-even calculation
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)

    if (expensesError) {
      logError('getDashboardMetrics', 'Error fetching expenses', expensesError, { userId })
    }

    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0

    return {
      month_year: currentMonth,
      forecast,
      results,
      history_12_months: history,
      total_expenses: totalExpenses
    }

  } catch (error) {
    logError('getDashboardMetrics', 'Error fetching dashboard metrics', error, { userId, currentMonth })

    // Return empty metrics on error
    return {
      month_year: currentMonth,
      forecast: createEmptyMetrics(),
      results: createEmptyMetrics(),
      history_12_months: [],
      total_expenses: 0
    }
  }
}

/**
 * Helper function to create empty metrics
 */
function createEmptyMetrics(): MetricsResult {
  return {
    total_sessions: 0,
    total_revenue: 0,
    total_variable_costs: 0,
    total_margin: 0,
    margin_percent: 0,
    break_even_status: 'deficit',
    by_therapy: []
  }
}
