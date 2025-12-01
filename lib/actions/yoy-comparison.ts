'use server'

import { createClient } from '@/utils/supabase/server'
import {
  calculateOccupancyRate,
  calculateRevenuePerSession,
  calculateCostPerSession,
  calculateProfitMarginPercent,
} from '@/lib/utils/kpi-helpers'

export interface YoYMetric {
  metric: string
  currentYear: number
  previousYear: number
  changePercent: number
  changeAbsolute: number
  trend: 'up' | 'down' | 'neutral'
  unit?: string
}

export interface YoYTherapyComparison {
  therapyName: string
  currentYearRevenue: number
  previousYearRevenue: number
  currentYearSessions: number
  previousYearSessions: number
  revenueChangePercent: number
  sessionsChangePercent: number
}

export interface YoYComparisonData {
  period: string // e.g., "November 2024 vs November 2025"
  metrics: YoYMetric[]
  therapies: YoYTherapyComparison[]
  ytdComparison: {
    currentYearToDate: number
    previousYearToDate: number
    changePercent: number
  }
}

/**
 * Calculate year-over-year comparison for a given month
 */
export async function getYoYComparison(
  year: number,
  month: number
): Promise<YoYComparisonData | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  try {
    // Fetch therapy types
    const { data: therapies } = await supabase
      .from('therapy_types')
      .select('*')
      .eq('user_id', user.id)

    if (!therapies) return null

    const therapyMap = new Map(therapies.map(t => [t.id, t]))

    // Current month date
    const currentDate = new Date(year, month - 1, 1)
    const currentMonthStr = currentDate.toISOString().split('T')[0].substring(0, 7)

    // Previous year same month
    const prevDate = new Date(year - 1, month - 1, 1)
    const prevMonthStr = prevDate.toISOString().split('T')[0].substring(0, 7)

    // Helper to get next month for range queries
    const getNextMonth = (monthStr: string) => {
      const y = parseInt(monthStr.substring(0, 4))
      const m = parseInt(monthStr.substring(5, 7))
      if (m === 12) {
        return (y + 1).toString() + '-01'
      }
      return y.toString() + '-' + (m + 1).toString().padStart(2, '0')
    }

    const currentNextMonth = getNextMonth(currentMonthStr)
    const prevNextMonth = getNextMonth(prevMonthStr)

    // Fetch current month plans and expenses
    const { data: currentPlans } = await supabase
      .from('monthly_plans')
      .select('*')
      .eq('user_id', user.id)
      .gte('month', currentMonthStr)
      .lt('month', currentNextMonth)

    const { data: currentExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('month', currentMonthStr)
      .lt('month', currentNextMonth)

    // Fetch previous year same month plans and expenses
    const { data: prevPlans } = await supabase
      .from('monthly_plans')
      .select('*')
      .eq('user_id', user.id)
      .gte('month', prevMonthStr)
      .lt('month', prevNextMonth)

    const { data: prevExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('month', prevMonthStr)
      .lt('month', prevNextMonth)

    if (!currentPlans || !currentExpenses || !prevPlans || !prevExpenses) {
      return null
    }

    // Calculate metrics for current month
    const currentMetrics = calculateMonthMetrics(
      currentPlans,
      currentExpenses,
      therapyMap
    )

    // Calculate metrics for previous year same month
    const prevMetrics = calculateMonthMetrics(
      prevPlans,
      prevExpenses,
      therapyMap
    )

    // Calculate therapy comparisons
    const therapyComparisons = calculateTherapyYoY(
      currentPlans,
      prevPlans,
      therapyMap
    )

    // Calculate YTD comparison
    const currentYTD = await getYTDMetrics(user.id, year)
    const prevYTD = await getYTDMetrics(user.id, year - 1)

    const yoyMetrics: YoYMetric[] = [
      {
        metric: 'Auslastungsquote',
        currentYear: currentMetrics.occupancyRate,
        previousYear: prevMetrics.occupancyRate,
        changePercent: calculateChangePercent(
          currentMetrics.occupancyRate,
          prevMetrics.occupancyRate
        ),
        changeAbsolute:
          currentMetrics.occupancyRate - prevMetrics.occupancyRate,
        trend: getTrend(currentMetrics.occupancyRate, prevMetrics.occupancyRate),
        unit: '%',
      },
      {
        metric: 'Umsatz pro Sitzung',
        currentYear: currentMetrics.revenuePerSession,
        previousYear: prevMetrics.revenuePerSession,
        changePercent: calculateChangePercent(
          currentMetrics.revenuePerSession,
          prevMetrics.revenuePerSession
        ),
        changeAbsolute:
          currentMetrics.revenuePerSession - prevMetrics.revenuePerSession,
        trend: getTrend(
          currentMetrics.revenuePerSession,
          prevMetrics.revenuePerSession
        ),
        unit: '€',
      },
      {
        metric: 'Kosten pro Sitzung',
        currentYear: currentMetrics.costPerSession,
        previousYear: prevMetrics.costPerSession,
        changePercent: calculateChangePercent(
          currentMetrics.costPerSession,
          prevMetrics.costPerSession
        ),
        changeAbsolute: currentMetrics.costPerSession - prevMetrics.costPerSession,
        trend: getTrend(currentMetrics.costPerSession, prevMetrics.costPerSession),
        unit: '€',
      },
      {
        metric: 'Gewinnmarge',
        currentYear: currentMetrics.profitMarginPercent,
        previousYear: prevMetrics.profitMarginPercent,
        changePercent: calculateChangePercent(
          currentMetrics.profitMarginPercent,
          prevMetrics.profitMarginPercent
        ),
        changeAbsolute:
          currentMetrics.profitMarginPercent - prevMetrics.profitMarginPercent,
        trend: getTrend(
          currentMetrics.profitMarginPercent,
          prevMetrics.profitMarginPercent
        ),
        unit: '%',
      },
    ]

    const monthName = currentDate.toLocaleDateString('de-DE', {
      month: 'long',
      year: 'numeric',
    })
    const periodStr = `${monthName} (${year}) vs ${monthName} (${year - 1})`

    return {
      period: periodStr,
      metrics: yoyMetrics,
      therapies: therapyComparisons,
      ytdComparison: {
        currentYearToDate: currentYTD,
        previousYearToDate: prevYTD,
        changePercent: calculateChangePercent(currentYTD, prevYTD),
      },
    }
  } catch (error) {
    console.error('[getYoYComparison] Error:', error)
    throw error
  }
}

/**
 * Calculate metrics for a month given plans and expenses
 */
function calculateMonthMetrics(
  plans: any[],
  expenses: any[],
  therapyMap: Map<string, any>
) {
  let totalPlannedSessions = 0
  let totalActualSessions = 0
  let totalRevenue = 0
  let totalVariableCosts = 0

  plans.forEach(plan => {
    const therapy = therapyMap.get(plan.therapy_type_id)
    if (!therapy) return

    totalPlannedSessions += plan.planned_sessions || 0
    totalActualSessions += plan.actual_sessions || 0

    const revenue = (plan.actual_sessions || 0) * therapy.price_per_session
    const variableCost =
      (plan.actual_sessions || 0) * therapy.variable_cost_per_session

    totalRevenue += revenue
    totalVariableCosts += variableCost
  })

  const fixedCosts = expenses.reduce((sum, exp) => {
    return sum + (exp.amount || 0)
  }, 0)

  const totalCosts = totalVariableCosts + fixedCosts
  const margin = totalRevenue - totalCosts

  return {
    occupancyRate:
      totalPlannedSessions > 0
        ? (totalActualSessions / totalPlannedSessions) * 100
        : 0,
    revenuePerSession:
      totalActualSessions > 0 ? totalRevenue / totalActualSessions : 0,
    costPerSession:
      totalActualSessions > 0 ? totalCosts / totalActualSessions : 0,
    profitMarginPercent:
      totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0,
  }
}

/**
 * Calculate therapy-level YoY comparison
 */
function calculateTherapyYoY(
  currentPlans: any[],
  prevPlans: any[],
  therapyMap: Map<string, any>
): YoYTherapyComparison[] {
  const therapyMap2 = new Map<string, any>()

  // Current year
  currentPlans.forEach(plan => {
    const therapy = therapyMap.get(plan.therapy_type_id)
    if (!therapy) return

    const key = therapy.id
    if (!therapyMap2.has(key)) {
      therapyMap2.set(key, {
        therapyName: therapy.name,
        therapyId: therapy.id,
        currentYearRevenue: 0,
        currentYearSessions: 0,
        previousYearRevenue: 0,
        previousYearSessions: 0,
      })
    }

    const data = therapyMap2.get(key)!
    data.currentYearSessions += plan.actual_sessions || 0
    data.currentYearRevenue +=
      (plan.actual_sessions || 0) * therapy.price_per_session
  })

  // Previous year
  prevPlans.forEach(plan => {
    const therapy = therapyMap.get(plan.therapy_type_id)
    if (!therapy) return

    const key = therapy.id
    if (!therapyMap2.has(key)) {
      therapyMap2.set(key, {
        therapyName: therapy.name,
        therapyId: therapy.id,
        currentYearRevenue: 0,
        currentYearSessions: 0,
        previousYearRevenue: 0,
        previousYearSessions: 0,
      })
    }

    const data = therapyMap2.get(key)!
    data.previousYearSessions += plan.actual_sessions || 0
    data.previousYearRevenue +=
      (plan.actual_sessions || 0) * therapy.price_per_session
  })

  return Array.from(therapyMap2.values()).map(therapy => ({
    therapyName: therapy.therapyName,
    currentYearRevenue: therapy.currentYearRevenue,
    previousYearRevenue: therapy.previousYearRevenue,
    currentYearSessions: therapy.currentYearSessions,
    previousYearSessions: therapy.previousYearSessions,
    revenueChangePercent: calculateChangePercent(
      therapy.currentYearRevenue,
      therapy.previousYearRevenue
    ),
    sessionsChangePercent: calculateChangePercent(
      therapy.currentYearSessions,
      therapy.previousYearSessions
    ),
  }))
}

/**
 * Get YTD metrics for a year
 */
async function getYTDMetrics(userId: string, year: number): Promise<number> {
  const supabase = await createClient()

  const startOfYear = new Date(year, 0, 1).toISOString().split('T')[0]
  const endOfYear = new Date(year, 11, 31).toISOString().split('T')[0]

  const { data: plans } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('user_id', userId)
    .gte('month', startOfYear)
    .lte('month', endOfYear)

  if (!plans) return 0

  const { data: therapies } = await supabase
    .from('therapy_types')
    .select('*')
    .eq('user_id', userId)

  if (!therapies) return 0

  const therapyMap = new Map(therapies.map(t => [t.id, t]))

  return plans.reduce((total, plan) => {
    const therapy = therapyMap.get(plan.therapy_type_id)
    if (!therapy) return total
    return total + (plan.actual_sessions || 0) * therapy.price_per_session
  }, 0)
}

/**
 * Calculate percentage change
 */
function calculateChangePercent(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100
  }
  return ((current - previous) / Math.abs(previous)) * 100
}

/**
 * Determine trend direction
 */
function getTrend(current: number, previous: number): 'up' | 'down' | 'neutral' {
  if (current > previous) return 'up'
  if (current < previous) return 'down'
  return 'neutral'
}
