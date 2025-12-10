'use server'

import { createClient } from '@/utils/supabase/server'
import type { TherapyType, BreakEvenAnalysis, PracticeSettings } from '@/lib/types'
import { calculatePaymentFee, calculateNetRevenuePerSession } from '@/lib/calculations/payment-fees'

interface BreakEvenResult {
  therapy_type_id: string
  therapy_name: string
  price_per_session: number
  contribution_margin: number
  contribution_margin_percent: number
  sessions_per_month_needed: number // break-even point
  sessions_per_month_actual?: number // average actual sessions
}

interface BreakEvenSummary {
  total_fixed_costs: number
  total_contribution_margin: number
  total_contribution_margin_percent: number
  sessions_needed_for_breakeven: number
  current_average_sessions: number
  profitability_status: 'profitable' | 'breakeven' | 'loss'
  monthly_surplus_deficit: number
}

/**
 * Get all therapy types with break-even calculations
 */
export async function getBreakEvenAnalysis(): Promise<BreakEvenAnalysis[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  // Use demo user if no authenticated user
  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

  // Fetch therapies
  const { data: therapyData, error: therapyError } = await supabase
    .from('therapy_types')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (therapyError) {
    console.error('Error fetching therapies for break-even:', therapyError)
    return []
  }

  // Fetch practice settings for variable cost and payment fee percentage
  const { data: settingsData } = await supabase
    .from('practice_settings')
    .select('average_variable_cost_per_session, payment_processing_fee_percentage')
    .eq('user_id', userId)
    .single()

  const variableCostPerSession = settingsData?.average_variable_cost_per_session || 0
  const feePercentage = settingsData?.payment_processing_fee_percentage || 1.39

  // Return therapy information with payment fee calculations
  return (therapyData || []).map((therapy: TherapyType) => {
    const paymentFeePerSession = calculatePaymentFee(therapy.price_per_session)
    const netRevenuePerSession = calculateNetRevenuePerSession(therapy.price_per_session)
    const contributionMargin = netRevenuePerSession - variableCostPerSession
    const contributionMarginPercent = therapy.price_per_session > 0
      ? (contributionMargin / netRevenuePerSession) * 100
      : 0

    return {
      therapy_type_id: therapy.id,
      therapy_type_name: therapy.name,
      price_per_session: therapy.price_per_session,
      payment_fee_per_session: paymentFeePerSession,
      net_revenue_per_session: netRevenuePerSession,
      variable_cost_per_session: variableCostPerSession,
      contribution_margin: contributionMargin,
      contribution_margin_percent: contributionMarginPercent
    }
  })
}

/**
 * Get expenses for a given month or all recurring expenses
 */
export async function getMonthlyExpenses(month?: string): Promise<number> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[getMonthlyExpenses] Authentication error:', authError)
    return 0
  }

  // Get all expenses
  const { data, error } = await supabase
    .from('expenses')
    .select('amount, is_recurring, recurrence_interval, expense_date')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching expenses:', error)
    return 0
  }

  let totalExpenses = 0
  const targetMonth = month || new Date().toISOString().slice(0, 7) // YYYY-MM

  // Calculate expenses for the month
  for (const expense of data || []) {
    if (expense.is_recurring) {
      // For recurring expenses, we need to determine if they apply to this month
      const expenseMonth = new Date(expense.expense_date)
        .toISOString()
        .slice(0, 7)

      // For simplicity, we'll count monthly recurring expenses for the specified month
      // and adjust for quarterly/yearly
      if (expense.recurrence_interval === 'monthly') {
        totalExpenses += expense.amount
      } else if (expense.recurrence_interval === 'quarterly') {
        // Count if it's the same quarter
        const expenseQuarter = Math.floor(
          new Date(expense.expense_date).getMonth() / 3
        )
        const targetQuarter = Math.floor(
          new Date(`${targetMonth}-01`).getMonth() / 3
        )
        if (expenseQuarter === targetQuarter) {
          totalExpenses += expense.amount
        }
      } else if (expense.recurrence_interval === 'yearly') {
        // Count if it's the same month
        if (expenseMonth === targetMonth) {
          totalExpenses += expense.amount
        }
      }
    } else {
      // One-time expenses - check if they fall in the target month
      const expenseMonth = new Date(expense.expense_date)
        .toISOString()
        .slice(0, 7)
      if (expenseMonth === targetMonth) {
        totalExpenses += expense.amount
      }
    }
  }

  return totalExpenses
}

/**
 * Get average monthly sessions for each therapy type
 */
export async function getAverageSessionsPerTherapy(month?: string): Promise<
  Record<
    string,
    {
      planned: number
      actual: number | null
    }
  >
> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[getAverageSessionsPerTherapy] Authentication error:', authError)
    return {}
  }

  // Get monthly plans
  const { data, error } = await supabase
    .from('monthly_plans')
    .select('therapy_type_id, planned_sessions, actual_sessions')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching monthly plans:', error)
    return {}
  }

  // Group by therapy type and calculate averages
  const result: Record<
    string,
    {
      planned: number
      actual: number | null
    }
  > = {}

  for (const plan of data || []) {
    if (!result[plan.therapy_type_id]) {
      result[plan.therapy_type_id] = {
        planned: 0,
        actual: null
      }
    }
    result[plan.therapy_type_id].planned += plan.planned_sessions
    if (plan.actual_sessions) {
      if (result[plan.therapy_type_id].actual === null) {
        result[plan.therapy_type_id].actual = 0
      }
      result[plan.therapy_type_id].actual += plan.actual_sessions
    }
  }

  // Calculate averages (divide by number of months tracked)
  // For now, we'll return the totals - frontend can handle averaging
  return result
}

/**
 * Calculate comprehensive break-even summary
 */
export async function calculateBreakEvenSummary(
  fixedCosts: number
): Promise<BreakEvenSummary> {
  // Get all therapies with break-even calculations
  const therapies = await getBreakEvenAnalysis()

  // Calculate weighted average contribution margin
  const totalContributionMargin = therapies.reduce(
    (sum, t) => sum + t.contribution_margin,
    0
  )
  const avgContributionMargin =
    therapies.length > 0
      ? totalContributionMargin / therapies.length
      : 0

  const avgContributionMarginPercent =
    therapies.length > 0
      ? therapies.reduce(
          (sum, t) => sum + t.contribution_margin_percent,
          0
        ) / therapies.length
      : 0

  // Calculate sessions needed for break-even
  const sessionsNeededForBreakeven =
    avgContributionMargin > 0
      ? Math.ceil(fixedCosts / avgContributionMargin)
      : 0

  // Get average sessions (placeholder - would be calculated from monthly plans)
  const currentAverageSessions = 0 // This would need to be calculated from actual data

  // Determine profitability
  let profitabilityStatus: 'profitable' | 'breakeven' | 'loss' = 'loss'
  let monthlySurplusDeficit = 0

  if (currentAverageSessions > sessionsNeededForBreakeven) {
    profitabilityStatus = 'profitable'
    monthlySurplusDeficit =
      (currentAverageSessions - sessionsNeededForBreakeven) *
      avgContributionMargin
  } else if (currentAverageSessions === sessionsNeededForBreakeven) {
    profitabilityStatus = 'breakeven'
    monthlySurplusDeficit = 0
  } else {
    profitabilityStatus = 'loss'
    monthlySurplusDeficit =
      (currentAverageSessions - sessionsNeededForBreakeven) *
      avgContributionMargin
  }

  return {
    total_fixed_costs: fixedCosts,
    total_contribution_margin: avgContributionMargin,
    total_contribution_margin_percent: avgContributionMarginPercent,
    sessions_needed_for_breakeven: sessionsNeededForBreakeven,
    current_average_sessions: currentAverageSessions,
    profitability_status: profitabilityStatus,
    monthly_surplus_deficit: monthlySurplusDeficit
  }
}

/**
 * Get comprehensive break-even report
 */
export async function getBreakEvenReport(month?: string) {
  const therapies = await getBreakEvenAnalysis()
  const monthlyExpenses = await getMonthlyExpenses(month)
  const sessionsByTherapy = await getAverageSessionsPerTherapy(month)

  // Calculate break-even for each therapy
  const breakEvenResults: BreakEvenResult[] = therapies.map((therapy) => {
    const sessions = sessionsByTherapy[therapy.therapy_type_id] || {
      planned: 0,
      actual: null
    }

    return {
      therapy_type_id: therapy.therapy_type_id,
      therapy_name: therapy.therapy_type_name,
      price_per_session: therapy.price_per_session,
      contribution_margin: therapy.contribution_margin,
      contribution_margin_percent: therapy.contribution_margin_percent,
      sessions_per_month_needed: Math.ceil(
        monthlyExpenses / (therapy.contribution_margin || 1)
      ),
      sessions_per_month_actual: sessions.actual || sessions.planned
    }
  })

  // Overall summary
  const overallContributionMargin = therapies.reduce(
    (sum, t) => sum + t.contribution_margin,
    0
  )
  const avgContributionMargin =
    therapies.length > 0
      ? overallContributionMargin / therapies.length
      : 0

  const totalSessionsNeeded = Math.ceil(
    monthlyExpenses / (avgContributionMargin || 1)
  )

  return {
    therapies: breakEvenResults,
    monthly_expenses: monthlyExpenses,
    sessions_needed_total: totalSessionsNeeded,
    average_contribution_margin: avgContributionMargin,
    timestamp: new Date().toISOString()
  }
}

/**
 * Get break-even history for multiple months
 */
export async function getBreakEvenHistory(
  monthRange: 'last3' | 'last6' | 'last12' = 'last3',
  fixedCosts: number = 2000
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[getBreakEvenHistory] Authentication error:', authError)
    return []
  }

  // Calculate month range
  const monthsToRetrieve = monthRange === 'last3' ? 3 : monthRange === 'last6' ? 6 : 12
  const months: string[] = []
  const today = new Date()

  for (let i = monthsToRetrieve - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthStr = date.toISOString().slice(0, 7)
    months.push(monthStr)
  }

  // Get all therapies
  const therapies = await getBreakEvenAnalysis()

  // Calculate history for each month
  const history = []

  for (const month of months) {
    const monthDate = `${month}-01`

    // Get monthly plans for this month
    const { data: plans, error: plansError } = await supabase
      .from('monthly_plans')
      .select('planned_sessions, actual_sessions')
      .eq('user_id', user.id)
      .eq('month', monthDate)

    if (plansError) {
      console.error(`Error fetching plans for ${month}:`, plansError)
      continue
    }

    // Calculate actual sessions completed (or planned if actual not available)
    const actualSessions = (plans || []).reduce((sum, plan) => {
      return sum + (plan.actual_sessions || plan.planned_sessions || 0)
    }, 0)

    // Calculate average contribution margin
    const totalContribution = therapies.reduce(
      (sum, t) => sum + t.contribution_margin,
      0
    )
    const avgContribution =
      therapies.length > 0 ? totalContribution / therapies.length : 0

    // Sessions needed for break-even
    const sessionsNeeded =
      avgContribution > 0 ? Math.ceil(fixedCosts / avgContribution) : 0

    // Profitability status
    let profitabilityStatus: 'surplus' | 'breakeven' | 'deficit' = 'deficit'
    if (actualSessions > sessionsNeeded) {
      profitabilityStatus = 'surplus'
    } else if (actualSessions === sessionsNeeded) {
      profitabilityStatus = 'breakeven'
    }

    history.push({
      month,
      sessionsNeeded,
      actualSessions,
      averageContributionMargin: avgContribution,
      profitabilityStatus,
      surplusDeficit: actualSessions - sessionsNeeded
    })
  }

  return history
}
