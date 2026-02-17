'use server'

import { createClient } from '@/utils/supabase/server'
import type { TherapyType, MonthlyPlan } from '@/lib/types'
import {
  calculateOccupancyRate,
  calculateRevenuePerSession,
  calculateCostPerSession,
  calculateProfitMarginPercent,
  calculateTrendPercent,
  calculateBreakEvenDistance,
  calculateWeightedContributionMargin,
  forecastRevenue,
  calculateAverageTherapyPrice,
} from '@/lib/utils/kpi-helpers'

export interface AdvancedAnalytics {
  // Basic KPIs
  occupancyRate: number
  revenuePerSession: number
  costPerSession: number
  profitMarginPercent: number

  // Trends
  revenueTrend: number | null
  costTrend: number | null
  profitTrend: number | null

  // Forecasting
  forecastedRevenue: number
  sessionsToBreakEven: number

  // Therapy Rankings
  topTherapyByRevenue: {
    name: string
    revenue: number
    sessions: number
  } | null
  topTherapyByMargin: {
    name: string
    margin: number
    marginPercent: number
  } | null

  // Cost Analysis
  averageSessionPrice: number
  totalVariableCosts: number
  costStructure: {
    variableCostsPercent: number
    fixedCostsPercent: number
  }
}

/**
 * Get advanced analytics for dashboard
 */
export async function getAdvancedAnalytics(): Promise<AdvancedAnalytics | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[getAdvancedAnalytics] Authentication error:', authError)
    return null
  }

  try {
    // Fetch therapy types
    const { data: therapies } = await supabase
      .from('therapy_types')
      .select('*')
      .eq('user_id', user.id)

    // Fetch ALL monthly plans (not just last 3 months)
    const { data: monthlyPlans } = await supabase
      .from('monthly_plans')
      .select('*')
      .eq('user_id', user.id)

    // Fetch ALL expenses (not just last 3 months)
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)

    console.log('[getAdvancedAnalytics] Data loaded:', {
      therapies: therapies?.length,
      monthlyPlans: monthlyPlans?.length,
      expenses: expenses?.length,
    })

    // Log first plan to see structure
    if (monthlyPlans && monthlyPlans.length > 0) {
      console.log('[getAdvancedAnalytics] First plan:', monthlyPlans[0])
    }

    // Allow empty expenses but need therapies and plans
    if (!therapies || !monthlyPlans) {
      console.log('[getAdvancedAnalytics] Missing required data, returning null')
      return null
    }

    // If no monthly plans, return null
    if (monthlyPlans.length === 0) {
      console.log('[getAdvancedAnalytics] No monthly plans found, returning null')
      return null
    }

    // Create therapy map for quick lookup
    const therapyMap = new Map(therapies.map(t => [t.id, t]))

    // Group plans by month
    const plansByMonth = new Map<string, typeof monthlyPlans>()
    monthlyPlans.forEach(plan => {
      const month = plan.month.substring(0, 7) // YYYY-MM
      if (!plansByMonth.has(month)) {
        plansByMonth.set(month, [])
      }
      plansByMonth.get(month)!.push(plan)
    })

    // Group expenses by month
    const expensesByMonth = new Map<string, typeof expenses>()
    if (expenses) {
      expenses.forEach((exp: any) => {
        // Handle both 'month' and 'expense_date' fields
        const dateStr = exp.month || exp.expense_date
        if (!dateStr) return
        const month = dateStr.substring(0, 7)
        if (!expensesByMonth.has(month)) {
          expensesByMonth.set(month, [])
        }
        expensesByMonth.get(month)!.push(exp)
      })
    }

    const months = Array.from(plansByMonth.keys()).sort()

    console.log('[getAdvancedAnalytics] Months found:', months)

    // Calculate metrics for each month
    const monthlyMetrics = months.map(month => {
      const plans = plansByMonth.get(month) || []
      const exps = expensesByMonth.get(month) || []

      console.log(`[getAdvancedAnalytics] Month ${month}: ${plans.length} plans`)
      if (plans.length > 0) {
        console.log(`[getAdvancedAnalytics] First plan in ${month}:`, {
          actual_sessions: plans[0].actual_sessions,
          planned_sessions: plans[0].planned_sessions,
          therapy_type_id: plans[0].therapy_type_id
        })
      }

      let totalPlannedSessions = 0
      let totalActualSessions = 0
      let totalRevenue = 0
      let totalVariableCosts = 0
      let therapyDetails: Array<{
        id: string
        name: string
        revenue: number
        margin: number
        marginPercent: number
        sessions: number
        cost: number
      }> = []

      plans.forEach(plan => {
        const therapy = therapyMap.get(plan.therapy_type_id)
        if (!therapy) return

        totalPlannedSessions += plan.planned_sessions || 0
        totalActualSessions += plan.actual_sessions || 0

        const plannedRevenue = (plan.planned_sessions || 0) * therapy.price_per_session
        const actualRevenue = (plan.actual_sessions || 0) * therapy.price_per_session
        const variableCost =
          (plan.actual_sessions || 0) * therapy.variable_cost_per_session

        totalRevenue += actualRevenue
        totalVariableCosts += variableCost

        const margin = actualRevenue - variableCost
        const marginPercent =
          actualRevenue > 0 ? (margin / actualRevenue) * 100 : 0

        therapyDetails.push({
          id: therapy.id,
          name: therapy.name,
          revenue: actualRevenue,
          margin,
          marginPercent,
          sessions: plan.actual_sessions || 0,
          cost: variableCost,
        })
      })

      const fixedCosts = exps.reduce((sum, exp) => sum + exp.amount, 0)
      const netIncome = totalRevenue - totalVariableCosts - fixedCosts

      return {
        month,
        plannedSessions: totalPlannedSessions,
        actualSessions: totalActualSessions,
        revenue: totalRevenue,
        variableCosts: totalVariableCosts,
        fixedCosts,
        netIncome,
        therapyDetails,
      }
    })

    if (monthlyMetrics.length === 0) {
      return null
    }

    // Calculate KPIs from most recent month
    const currentMonth = monthlyMetrics[monthlyMetrics.length - 1]
    const previousMonth = monthlyMetrics[monthlyMetrics.length - 2] || null

    const occupancyRate = calculateOccupancyRate(
      currentMonth.actualSessions,
      currentMonth.plannedSessions
    )

    const revenuePerSession = calculateRevenuePerSession(
      currentMonth.revenue,
      currentMonth.actualSessions
    )

    const costPerSession = calculateCostPerSession(
      currentMonth.variableCosts,
      currentMonth.actualSessions
    )

    const profitMarginPercent = calculateProfitMarginPercent(
      currentMonth.netIncome,
      currentMonth.revenue
    )

    // Calculate trends
    const revenueTrend = previousMonth
      ? calculateTrendPercent(currentMonth.revenue, previousMonth.revenue)
      : null

    const costTrend = previousMonth
      ? calculateTrendPercent(
          currentMonth.variableCosts,
          previousMonth.variableCosts
        )
      : null

    const profitTrend = previousMonth
      ? calculateTrendPercent(currentMonth.netIncome, previousMonth.netIncome)
      : null

    // Forecast next month
    const revenueHistory = monthlyMetrics.map(m => m.revenue)
    const forecastedRevenue = forecastRevenue(revenueHistory)

    // Calculate break-even distance
    const weightedMargin = calculateWeightedContributionMargin(
      currentMonth.therapyDetails.map(t => ({
        sessions: t.sessions,
        margin: t.marginPercent / 100,
      }))
    )

    const sessionsToBreakEven = calculateBreakEvenDistance(
      currentMonth.fixedCosts,
      revenuePerSession - costPerSession
    )

    // Find top therapies
    const topByRevenue = currentMonth.therapyDetails.sort(
      (a, b) => b.revenue - a.revenue
    )[0] || null

    const topByMargin = currentMonth.therapyDetails.sort(
      (a, b) => b.margin - a.margin
    )[0] || null

    // Calculate average session price
    const avgSessionPrice = calculateAverageTherapyPrice(
      therapies.map(t => t.price_per_session)
    )

    // Calculate cost structure
    const totalCosts = currentMonth.variableCosts + currentMonth.fixedCosts
    const variableCostsPercent =
      totalCosts > 0 ? (currentMonth.variableCosts / totalCosts) * 100 : 0
    const fixedCostsPercent = 100 - variableCostsPercent

    return {
      occupancyRate,
      revenuePerSession,
      costPerSession,
      profitMarginPercent,
      revenueTrend,
      costTrend,
      profitTrend,
      forecastedRevenue,
      sessionsToBreakEven,
      topTherapyByRevenue: topByRevenue
        ? {
            name: topByRevenue.name,
            revenue: topByRevenue.revenue,
            sessions: topByRevenue.sessions,
          }
        : null,
      topTherapyByMargin: topByMargin
        ? {
            name: topByMargin.name,
            margin: topByMargin.margin,
            marginPercent: topByMargin.marginPercent,
          }
        : null,
      averageSessionPrice: avgSessionPrice,
      totalVariableCosts: currentMonth.variableCosts,
      costStructure: {
        variableCostsPercent,
        fixedCostsPercent,
      },
    }
  } catch (error) {
    console.error('[getAdvancedAnalytics] Error:', error)
    return null
  }
}
