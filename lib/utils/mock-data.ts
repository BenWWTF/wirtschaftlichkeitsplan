/**
 * Mock data generators for development/testing
 * Provides realistic demo data when Supabase is unavailable
 */

import type {
  MonthlyMetrics,
  TherapyMetrics,
  DashboardSummary
} from '@/lib/actions/dashboard'
import type { BreakEvenAnalysis, TherapyType } from '@/lib/types'

const MOCK_THERAPY_TYPES = [
  {
    id: 'therapy-1',
    name: 'Psychotherapie',
    price_per_session: 100,
    variable_cost_per_session: 15
  },
  {
    id: 'therapy-2',
    name: 'Coaching',
    price_per_session: 80,
    variable_cost_per_session: 10
  },
  {
    id: 'therapy-3',
    name: 'Gruppentherapie',
    price_per_session: 45,
    variable_cost_per_session: 8
  }
]

/**
 * Generate mock therapy types for development
 */
export function generateMockTherapyTypes(): TherapyType[] {
  return MOCK_THERAPY_TYPES.map((therapy, index) => ({
    id: therapy.id,
    user_id: '00000000-0000-0000-0000-000000000000',
    name: therapy.name,
    price_per_session: therapy.price_per_session,
    variable_cost_per_session: therapy.variable_cost_per_session,
    created_at: new Date(Date.now() - (2 - index) * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - (2 - index) * 7 * 24 * 60 * 60 * 1000).toISOString()
  }))
}

export function generateMockMonthlyMetrics(month: string): MonthlyMetrics {
  const plannedSessions = Math.floor(Math.random() * 30) + 20
  const actualSessions = Math.floor(plannedSessions * 0.85) + Math.floor(Math.random() * 5)

  const avgPrice = 80
  const avgVariableCost = 12
  const fixedCosts = 2000

  const plannedRevenue = plannedSessions * avgPrice
  const actualRevenue = actualSessions * avgPrice
  const totalExpenses = actualSessions * avgVariableCost + fixedCosts

  return {
    month,
    planned_sessions: plannedSessions,
    actual_sessions: actualSessions,
    planned_revenue: plannedRevenue,
    actual_revenue: actualRevenue,
    total_expenses: totalExpenses,
    planned_margin: plannedRevenue - totalExpenses,
    actual_margin: actualRevenue - totalExpenses,
    profitability: ((actualRevenue - totalExpenses) / actualRevenue) * 100
  }
}

export function generateMockTherapyMetrics(): TherapyMetrics[] {
  return MOCK_THERAPY_TYPES.map(therapy => {
    const totalPlannedSessions = Math.floor(Math.random() * 40) + 20
    const totalActualSessions = Math.floor(totalPlannedSessions * 0.9)
    const totalRevenue = totalActualSessions * therapy.price_per_session
    const totalVariableCost = totalActualSessions * therapy.variable_cost_per_session
    const totalMargin = totalRevenue - totalVariableCost

    return {
      therapy_id: therapy.id,
      therapy_name: therapy.name,
      price_per_session: therapy.price_per_session,
      variable_cost_per_session: therapy.variable_cost_per_session,
      contribution_margin: therapy.price_per_session - therapy.variable_cost_per_session,
      total_planned_sessions: totalPlannedSessions,
      total_actual_sessions: totalActualSessions,
      total_revenue: totalRevenue,
      total_margin: totalMargin,
      profitability_percent: (totalMargin / totalRevenue) * 100
    }
  })
}

export function generateMockDashboardSummary(): DashboardSummary {
  const therapyMetrics = generateMockTherapyMetrics()
  const totalRevenue = therapyMetrics.reduce((sum, t) => sum + t.total_revenue, 0)
  const totalExpenses = therapyMetrics.reduce((sum, t) => sum + (t.total_actual_sessions * t.variable_cost_per_session), 0) + 2000
  const netIncome = totalRevenue - totalExpenses
  const totalSessions = therapyMetrics.reduce((sum, t) => sum + t.total_actual_sessions, 0)

  return {
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    net_income: netIncome,
    total_sessions: totalSessions,
    average_session_price: totalRevenue / totalSessions,
    profitability_rate: (netIncome / totalRevenue) * 100,
    break_even_status: netIncome > 0 ? 'surplus' : netIncome === 0 ? 'breakeven' : 'deficit'
  }
}

export function generateMockBreakEvenAnalysis(): BreakEvenAnalysis[] {
  return MOCK_THERAPY_TYPES.map(therapy => {
    const contributionMargin = therapy.price_per_session - therapy.variable_cost_per_session
    const contributionMarginPercent = (contributionMargin / therapy.price_per_session) * 100

    return {
      therapy_type_id: therapy.id,
      therapy_type_name: therapy.name,
      price_per_session: therapy.price_per_session,
      variable_cost_per_session: therapy.variable_cost_per_session,
      contribution_margin: contributionMargin,
      contribution_margin_percent: contributionMarginPercent
    }
  })
}

/**
 * Utility to check if we're in development mode without real Supabase
 */
export function isDevelopmentMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dev.supabase.co') ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://dev.supabase.co'
  )
}
