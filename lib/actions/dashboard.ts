'use server'

import { createClient } from '@/utils/supabase/server'
import type { TherapyType, MonthlyPlan } from '@/lib/types'
import { calculateNetRevenue, calculateSumUpCosts, calculateTotalCostsWithSumUp } from '@/lib/calculations/payment-fees'

export interface MonthlyMetrics {
  month: string
  planned_sessions: number
  actual_sessions: number
  planned_revenue: number
  actual_revenue: number
  actual_revenue_after_fees: number
  planned_revenue_after_fees: number
  total_expenses: number
  planned_margin: number
  actual_margin: number
  planned_margin_after_fees: number
  actual_margin_after_fees: number
  profitability: number
  profitability_after_fees: number
  // SumUp costs as separate line item
  planned_sumup_costs: number
  actual_sumup_costs: number
  total_costs_with_sumup: number
}

export interface TherapyMetrics {
  therapy_id: string
  therapy_name: string
  price_per_session: number
  total_planned_sessions: number
  total_actual_sessions: number
  total_revenue: number
  profitability_percent: number
}

export interface DashboardSummary {
  total_revenue: number
  total_expenses: number
  sumup_costs: number
  total_costs_with_sumup: number
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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[getMonthlyMetrics] Authentication error:', authError)
    return null
  }

  // Fetch practice settings to get payment fee percentage
  const { data: settings } = await supabase
    .from('practice_settings')
    .select('payment_processing_fee_percentage')
    .eq('user_id', user.id)
    .single()

  const paymentFeePercentage = settings?.payment_processing_fee_percentage || 0

  // Convert YYYY-MM to YYYY-MM-01 for date column
  const monthDate = month.includes('-') && month.length === 7
    ? `${month}-01`
    : month

  // Get monthly plans first
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('id, planned_sessions, actual_sessions, therapy_type_id')
    .eq('user_id', user.id)
    .eq('month', monthDate)

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

  // Get monthly expenses - filter to the specific month
  const nextMonthDate = new Date(Number(monthDate.split('-')[0]), Number(monthDate.split('-')[1]), 1)
  const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`

  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('amount, spread_monthly, recurrence_interval')
    .eq('user_id', user.id)
    .gte('expense_date', monthDate)
    .lt('expense_date', nextMonthStr)

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
    if (!therapy) {
      console.warn(`Therapy not found for ID: ${plan.therapy_type_id}`)
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

  // Calculate total expenses for this month, applying spread_monthly logic
  const monthlyExpenses = expenses?.reduce((sum, e) => {
    // If expense is marked to spread monthly, apply the divisor
    if (e.spread_monthly) {
      if (e.recurrence_interval === 'yearly') {
        return sum + (e.amount / 12)
      } else if (e.recurrence_interval === 'quarterly') {
        return sum + (e.amount / 3)
      }
    }
    return sum + e.amount
  }, 0) || 0

  // Apply payment fee to calculate net values
  const totalPlannedRevenueAfterFees = calculateNetRevenue(totalPlannedRevenue, paymentFeePercentage)
  const totalActualRevenueAfterFees = calculateNetRevenue(totalActualRevenue, paymentFeePercentage)

  const feeDeductionFactor = 1 - (paymentFeePercentage / 100)
  const totalPlannedMarginAfterFees = totalPlannedMargin * feeDeductionFactor
  const totalActualMarginAfterFees = totalActualMargin * feeDeductionFactor

  const profitability = totalActualMargin - monthlyExpenses
  const profitabilityAfterFees = totalActualMarginAfterFees - monthlyExpenses

  // Calculate SumUp costs as separate line item
  const plannedSumUpCosts = calculateSumUpCosts(totalPlannedRevenue, paymentFeePercentage)
  const actualSumUpCosts = calculateSumUpCosts(totalActualRevenue, paymentFeePercentage)
  const totalCostsWithSumUp = calculateTotalCostsWithSumUp(monthlyExpenses, totalActualRevenue, paymentFeePercentage)

  return {
    month,
    planned_sessions: totalPlannedSessions,
    actual_sessions: totalActualSessions,
    planned_revenue: totalPlannedRevenue,
    actual_revenue: totalActualRevenue,
    actual_revenue_after_fees: totalActualRevenueAfterFees,
    planned_revenue_after_fees: totalPlannedRevenueAfterFees,
    total_expenses: monthlyExpenses,
    planned_margin: totalPlannedMargin,
    actual_margin: totalActualMargin,
    planned_margin_after_fees: totalPlannedMarginAfterFees,
    actual_margin_after_fees: totalActualMarginAfterFees,
    profitability,
    profitability_after_fees: profitabilityAfterFees,
    planned_sumup_costs: plannedSumUpCosts,
    actual_sumup_costs: actualSumUpCosts,
    total_costs_with_sumup: totalCostsWithSumUp
  }
}

/**
 * Get metrics for multiple months
 */
export async function getMonthlyMetricsRange(
  startMonthOrMonthsBack: string | number,
  endMonth?: string
): Promise<MonthlyMetrics[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[getMonthlyMetricsRange] Authentication error:', authError)
    return []
  }

  // Handle both calling patterns:
  // 1. getMonthlyMetricsRange(6) - last 6 months
  // 2. getMonthlyMetricsRange('2024-01', '2024-06') - specific date range
  let startDate: string
  let endDateString: string

  if (typeof startMonthOrMonthsBack === 'number') {
    // Calculate date range for last N months
    const today = new Date()
    const endDateObj = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const startDateObj = new Date(today.getFullYear(), today.getMonth() - startMonthOrMonthsBack + 1, 1)

    startDate = startDateObj.toISOString().split('T')[0]
    endDateString = endDateObj.toISOString().split('T')[0]
  } else {
    // Use provided strings
    const startMonth = startMonthOrMonthsBack
    endDateString = endMonth || startMonth

    startDate = startMonth.includes('-') && startMonth.length === 7
      ? `${startMonth}-01`
      : startMonth
    endDateString = endDateString.includes('-') && endDateString.length === 7
      ? `${endDateString}-01`
      : endDateString
  }

  // Fetch practice settings to get payment fee percentage
  const { data: settings } = await supabase
    .from('practice_settings')
    .select('payment_processing_fee_percentage')
    .eq('user_id', user.id)
    .single()

  const paymentFeePercentage = settings?.payment_processing_fee_percentage || 0
  const feeDeductionFactor = 1 - (paymentFeePercentage / 100)

  // Get all monthly plans in range
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('month, planned_sessions, actual_sessions, therapy_type_id')
    .eq('user_id', user.id)
    .gte('month', startDate)
    .lte('month', endDateString)
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
    .select('amount, expense_date, spread_monthly, recurrence_interval')
    .eq('user_id', user.id)

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
        actual_revenue_after_fees: 0,
        planned_revenue_after_fees: 0,
        total_expenses: 0,
        planned_margin: 0,
        actual_margin: 0,
        planned_margin_after_fees: 0,
        actual_margin_after_fees: 0,
        profitability: 0,
        profitability_after_fees: 0,
        planned_sumup_costs: 0,
        actual_sumup_costs: 0,
        total_costs_with_sumup: 0
      }
    }

    const therapy = therapyMap[(plan.therapy_type_id as string)]
    if (!therapy) {
      console.warn(`Therapy not found for ID: ${plan.therapy_type_id}`)
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

  // Add expenses - normalize to YYYY-MM-DD to match monthlyData keys
  // Apply spread_monthly logic for annual/quarterly expenses
  if (expenses) {
    for (const expense of expenses) {
      const expenseMonth = String(expense.expense_date).slice(0, 7)
      // monthlyData keys are "YYYY-MM-DD" from PostgreSQL DATE type
      const matchingKey = Object.keys(monthlyData).find(
        key => key.slice(0, 7) === expenseMonth
      )
      if (matchingKey) {
        // Calculate actual monthly amount considering spread_monthly flag
        let monthlyAmount = expense.amount
        if (expense.spread_monthly) {
          if (expense.recurrence_interval === 'yearly') {
            monthlyAmount = expense.amount / 12
          } else if (expense.recurrence_interval === 'quarterly') {
            monthlyAmount = expense.amount / 3
          }
        }
        monthlyData[matchingKey].total_expenses += monthlyAmount
      }
    }
  }

  // Calculate profitability and apply payment fees
  for (const month in monthlyData) {
    const data = monthlyData[month]

    // Apply payment fees
    data.planned_revenue_after_fees = calculateNetRevenue(data.planned_revenue, paymentFeePercentage)
    data.actual_revenue_after_fees = calculateNetRevenue(data.actual_revenue, paymentFeePercentage)
    data.planned_margin_after_fees = data.planned_margin * feeDeductionFactor
    data.actual_margin_after_fees = data.actual_margin * feeDeductionFactor

    // Calculate SumUp costs as separate line item
    data.planned_sumup_costs = calculateSumUpCosts(data.planned_revenue, paymentFeePercentage)
    data.actual_sumup_costs = calculateSumUpCosts(data.actual_revenue, paymentFeePercentage)
    data.total_costs_with_sumup = calculateTotalCostsWithSumUp(data.total_expenses, data.actual_revenue, paymentFeePercentage)

    // Calculate profitability
    data.profitability = data.actual_margin - data.total_expenses
    data.profitability_after_fees = data.actual_margin_after_fees - data.total_expenses
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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[getTherapyMetrics] Authentication error:', authError)
    return []
  }

  // Get all therapies
  const { data: therapies, error: therapiesError } = await supabase
    .from('therapy_types')
    .select('*')
    .eq('user_id', user.id)

  if (therapiesError || !therapies) {
    console.error('Error fetching therapies:', therapiesError)
    return []
  }

  // Get all monthly plans
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('therapy_type_id, planned_sessions, actual_sessions')
    .eq('user_id', user.id)

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
    const profitabilityPercent =
      totalPlannedSessions > 0
        ? (totalActualSessions / totalPlannedSessions) * 100
        : 0

    return {
      therapy_id: therapy.id,
      therapy_name: therapy.name,
      price_per_session: therapy.price_per_session,
      total_planned_sessions: totalPlannedSessions,
      total_actual_sessions: totalActualSessions,
      total_revenue: totalRevenue,
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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[getDashboardSummary] Authentication error:', authError)
    return {
      total_revenue: 0,
      total_expenses: 0,
      sumup_costs: 0,
      total_costs_with_sumup: 0,
      net_income: 0,
      total_sessions: 0,
      average_session_price: 0,
      profitability_rate: 0,
      break_even_status: 'deficit'
    }
  }

  // Fetch practice settings to get payment fee percentage
  const { data: settings } = await supabase
    .from('practice_settings')
    .select('payment_processing_fee_percentage')
    .eq('user_id', user.id)
    .single()

  const paymentFeePercentage = settings?.payment_processing_fee_percentage || 0

  // Get therapy metrics
  const therapyMetrics = await getTherapyMetrics()

  // Get all expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, spread_monthly, recurrence_interval')
    .eq('user_id', user.id)

  const totalRevenue = therapyMetrics.reduce((sum, t) => sum + t.total_revenue, 0)
  const totalRevenueAfterFees = calculateNetRevenue(totalRevenue, paymentFeePercentage)
  // Calculate total expenses, applying spread_monthly logic for annual/quarterly expenses
  const totalExpenses = expenses?.reduce((sum, e) => {
    // If expense is marked to spread monthly, apply the divisor
    if (e.spread_monthly) {
      if (e.recurrence_interval === 'yearly') {
        return sum + (e.amount / 12)
      } else if (e.recurrence_interval === 'quarterly') {
        return sum + (e.amount / 3)
      }
    }
    return sum + e.amount
  }, 0) || 0
  const totalSessions = therapyMetrics.reduce(
    (sum, t) => sum + t.total_actual_sessions,
    0
  )

  // Calculate SumUp costs as separate line item
  const sumUpCosts = calculateSumUpCosts(totalRevenue, paymentFeePercentage)
  const totalCostsWithSumUp = calculateTotalCostsWithSumUp(totalExpenses, totalRevenue, paymentFeePercentage)

  const averageSessionPrice =
    totalSessions > 0 ? totalRevenueAfterFees / totalSessions : 0
  const netIncome = totalRevenue - totalCostsWithSumUp
  const profitabilityRate =
    totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0

  const breakEvenStatus: 'surplus' | 'breakeven' | 'deficit' =
    netIncome > 0 ? 'surplus' : netIncome === 0 ? 'breakeven' : 'deficit'

  return {
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    sumup_costs: sumUpCosts,
    total_costs_with_sumup: totalCostsWithSumUp,
    net_income: netIncome,
    total_sessions: totalSessions,
    average_session_price: averageSessionPrice,
    profitability_rate: profitabilityRate,
    break_even_status: breakEvenStatus
  }
}
