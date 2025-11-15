/**
 * Unified Metrics Engine
 * Single entry point for all dashboard metrics across all time scopes
 *
 * This module orchestrates the calculation layer and provides consistent
 * data structures regardless of scope (month/quarter/year/allTime)
 */

'use server'

import { createClient } from '@/utils/supabase/server'

import {
  calculateSessionRevenue,
  calculateTotalRevenue,
  calculateAveragePricePerSession,
  calculateMargin,
  calculateContributionMargin,
  calculateSessionMetrics,
  calculateViabilityScore,
  detectVariances,
  calculateForecast
} from '@/lib/calculations'

import type {
  ViabilityScore,
  VarianceAlert,
  TherapyMetric,
  MonthlyMetric,
  ForecastDataPoint,
  MetricsData
} from '@/lib/calculations'

// ============================================================================
// Type Definitions
// ============================================================================

export type MetricsScope = 'month' | 'quarter' | 'year' | 'allTime'
export type ComparisonMode = 'none' | 'plan' | 'lastPeriod' | 'lastYear'

export interface UnifiedMetricsInput {
  scope: MetricsScope
  date?: Date
  compareMode?: ComparisonMode
  userId?: string
}

export interface UnifiedMetricsResponse {
  // Metadata
  scope: MetricsScope
  period: { start: Date; end: Date }
  comparison?: {
    mode: ComparisonMode
    period: { start: Date; end: Date }
  }

  // Tier 1: Critical Metrics (visible immediately)
  viabilityScore: ViabilityScore
  breakEvenStatus: 'surplus' | 'breakeven' | 'deficit'
  netIncome: number

  // Tier 2: Primary KPI Metrics
  totalRevenue: number
  totalExpenses: number
  totalSessions: number
  totalPlannedSessions: number
  averageSessionPrice: number
  marginPercent: number

  // Tier 3: Detailed Breakdown
  therapyMetrics: TherapyMetric[]
  monthlyBreakdown?: MonthlyMetric[]

  // Actionable Intelligence
  variances: VarianceAlert[]
  forecast?: ForecastDataPoint[]

  // Metadata
  lastUpdated: Date
  dataQuality: 'complete' | 'partial' | 'insufficient'
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Get unified metrics for a given scope
 * Single function that handles all data fetching and calculations
 *
 * @param input UnifiedMetricsInput with scope, date, and comparison mode
 * @returns Complete metrics response with all calculated values
 */
export async function getUnifiedMetrics(
  input: UnifiedMetricsInput
): Promise<UnifiedMetricsResponse> {
  const supabase = await createClient()
  const userId = input.userId || '00000000-0000-0000-0000-000000000000'

  try {
    // 1. Determine period dates
    const period = getPeriodDates(input.scope, input.date)

    // 2. Fetch raw data for the period
    const scopeData = await fetchScopeData(supabase, userId, input.scope, period)

    // 3. Fetch comparison data if requested
    let comparisonData: MetricsData | null = null
    let comparisonPeriod: { start: Date; end: Date } | null = null
    if (input.compareMode && input.compareMode !== 'none') {
      const comparison = getComparisonPeriod(
        input.scope,
        input.date,
        input.compareMode
      )
      comparisonData = await fetchScopeData(supabase, userId, input.scope, comparison)
      comparisonPeriod = comparison
    }

    // 4. Calculate all metrics using pure functions
    const calculatedMetrics = calculateMetrics(scopeData)

    // 5. Detect variances if comparison data exists
    const variances: VarianceAlert[] = []
    if (comparisonData && input.compareMode && input.compareMode !== 'none') {
      const comparison = detectVariances(
        {
          actualRevenue: scopeData.totalRevenue,
          plannedRevenue: comparisonData.totalRevenue,
          actualExpenses: scopeData.totalExpenses,
          plannedExpenses: comparisonData.totalExpenses,
          actualSessions: scopeData.totalSessions,
          plannedSessions: comparisonData.totalSessions,
          therapyMetrics: scopeData.therapyMetrics.map((t) => ({
            id: t.id,
            name: t.name,
            actualSessions: t.actualSessions,
            plannedSessions: t.plannedSessions,
            actualRevenue: t.totalRevenue,
            plannedRevenue: t.totalRevenue // Placeholder
          }))
        },
        {
          actualRevenue: comparisonData.totalRevenue,
          plannedRevenue: comparisonData.totalRevenue,
          actualExpenses: comparisonData.totalExpenses,
          plannedExpenses: comparisonData.totalExpenses,
          actualSessions: comparisonData.totalSessions,
          plannedSessions: comparisonData.totalSessions,
          therapyMetrics: comparisonData.therapyMetrics.map((t) => ({
            id: t.id,
            name: t.name,
            actualSessions: t.actualSessions,
            plannedSessions: t.plannedSessions,
            actualRevenue: t.totalRevenue,
            plannedRevenue: t.totalRevenue
          }))
        }
      )
      variances.push(...comparison)
    }

    // 6. Generate forecast if applicable
    let forecast: ForecastDataPoint[] | undefined
    if (input.scope === 'year' || input.scope === 'allTime') {
      const historicalData = await fetchHistoricalData(supabase, userId, 12)
      forecast = calculateForecast(
        historicalData.map((h) => ({
          month: h.month,
          revenue: h.totalRevenue,
          sessions: h.totalSessions,
          expenses: h.totalExpenses
        })),
        6
      )
    }

    // 7. Determine data quality
    const dataQuality = determineDataQuality(scopeData, input.scope)

    // 8. Return unified response
    return {
      scope: input.scope,
      period,
      comparison: comparisonPeriod
        ? { mode: input.compareMode!, period: comparisonPeriod }
        : undefined,
      viabilityScore: calculatedMetrics.viabilityScore,
      breakEvenStatus: calculatedMetrics.breakEvenStatus,
      netIncome: calculatedMetrics.netIncome,
      totalRevenue: calculatedMetrics.totalRevenue,
      totalExpenses: calculatedMetrics.totalExpenses,
      totalSessions: calculatedMetrics.totalSessions,
      totalPlannedSessions: calculatedMetrics.totalPlannedSessions,
      averageSessionPrice: calculatedMetrics.averageSessionPrice,
      marginPercent: calculatedMetrics.marginPercent,
      therapyMetrics: scopeData.therapyMetrics,
      monthlyBreakdown:
        input.scope === 'quarter' || input.scope === 'year'
          ? scopeData.monthlyBreakdown
          : undefined,
      variances,
      forecast,
      lastUpdated: new Date(),
      dataQuality
    }
  } catch (error) {
    console.error('Error in getUnifiedMetrics:', error)
    throw error
  }
}

// ============================================================================
// Helper Functions: Date/Period Management
// ============================================================================

/**
 * Get start and end dates for a given scope
 */
function getPeriodDates(
  scope: MetricsScope,
  date?: Date
): { start: Date; end: Date } {
  const now = date || new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  switch (scope) {
    case 'month':
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 0)
      }

    case 'quarter': {
      const quarterMonth = Math.floor(month / 3) * 3
      return {
        start: new Date(year, quarterMonth, 1),
        end: new Date(year, quarterMonth + 3, 0)
      }
    }

    case 'year':
      return {
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31)
      }

    case 'allTime':
      return {
        start: new Date(2000, 0, 1),
        end: new Date()
      }
  }
}

/**
 * Get comparison period based on mode
 */
function getComparisonPeriod(
  scope: MetricsScope,
  date: Date = new Date(),
  mode: ComparisonMode
): { start: Date; end: Date } {
  const year = date.getFullYear()
  const month = date.getMonth()

  switch (mode) {
    case 'lastPeriod':
      switch (scope) {
        case 'month':
          return {
            start: new Date(year, month - 1, 1),
            end: new Date(year, month, 0)
          }
        case 'quarter': {
          const quarterMonth = Math.floor(month / 3) * 3
          return {
            start: new Date(year, quarterMonth - 3, 1),
            end: new Date(year, quarterMonth, 0)
          }
        }
        case 'year':
          return {
            start: new Date(year - 1, 0, 1),
            end: new Date(year - 1, 11, 31)
          }
        case 'allTime':
          return getPeriodDates('year', new Date(year - 1, 0, 1))
      }
      break

    case 'lastYear':
      return {
        start: new Date(year - 1, month, 1),
        end: new Date(year - 1, month + 1, 0)
      }

    case 'plan':
      // Plan is typically the same period but with planned vs actual
      return getPeriodDates(scope, date)

    default:
      return getPeriodDates(scope, date)
  }
}

// ============================================================================
// Helper Functions: Data Fetching
// ============================================================================

interface RawScopeData {
  therapyMetrics: Array<{
    id: string
    name: string
    plannedSessions: number
    actualSessions: number
    price: number
    variableCost: number
  }>
  totalExpenses: number
  monthlyData: Array<{ month: Date; sessions: number; revenue: number }>
}

/**
 * Fetch raw data for a given scope and period
 */
async function fetchScopeData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  scope: MetricsScope,
  period: { start: Date; end: Date }
): Promise<MetricsData> {
  // Fetch therapy types
  const { data: therapies } = await supabase
    .from('therapy_types')
    .select('id, name, price_per_session, variable_cost_per_session')
    .eq('user_id', userId)

  // Fetch monthly plans for the period
  const { data: plans } = await supabase
    .from('monthly_plans')
    .select(
      'id, therapy_type_id, month, planned_sessions, actual_sessions'
    )
    .eq('user_id', userId)
    .gte('month', period.start.toISOString().split('T')[0])
    .lte('month', period.end.toISOString().split('T')[0])

  // Fetch expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, month')
    .eq('user_id', userId)
    .gte('month', period.start.toISOString().split('T')[0])
    .lte('month', period.end.toISOString().split('T')[0])

  // Aggregate data by therapy type
  const therapyMap = new Map<string, TherapyMetric>()

  if (therapies) {
    therapies.forEach((therapy: any) => {
      const therapyPlans = plans?.filter(
        (p: any) => p.therapy_type_id === therapy.id
      ) || []

      const totalPlanned = therapyPlans.reduce(
        (sum: number, p: any) => sum + (p.planned_sessions || 0),
        0
      )
      const totalActual = therapyPlans.reduce(
        (sum: number, p: any) => sum + (p.actual_sessions || 0),
        0
      )

      const totalRevenue = calculateSessionRevenue(
        totalActual,
        therapy.price_per_session
      ).revenue

      const margin = calculateContributionMargin(
        therapy.price_per_session,
        therapy.variable_cost_per_session
      )

      const sessionMetrics = calculateSessionMetrics(totalPlanned, totalActual)

      therapyMap.set(therapy.id, {
        id: therapy.id,
        name: therapy.name,
        plannedSessions: totalPlanned,
        actualSessions: totalActual,
        pricePerSession: therapy.price_per_session,
        variableCostPerSession: therapy.variable_cost_per_session,
        totalRevenue,
        totalMargin: totalActual * margin.margin,
        marginPercent: margin.marginPercent,
        utilizationRate: sessionMetrics.utilizationRate
      })
    })
  }

  const therapyMetrics = Array.from(therapyMap.values())

  // Calculate totals
  const totalRevenue = therapyMetrics.reduce((sum, t) => sum + t.totalRevenue, 0)
  const totalExpenses = (expenses || []).reduce(
    (sum: number, e: any) => sum + (e.amount || 0),
    0
  )
  const totalSessions = therapyMetrics.reduce(
    (sum, t) => sum + t.actualSessions,
    0
  )
  const totalPlanned = therapyMetrics.reduce(
    (sum, t) => sum + t.plannedSessions,
    0
  )

  const netIncome = totalRevenue - totalExpenses
  const marginPercent = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0

  return {
    totalRevenue,
    totalExpenses,
    totalSessions,
    totalPlannedSessions: totalPlanned,
    netIncome,
    marginPercent,
    therapyMetrics,
    monthlyBreakdown: [] // TODO: Calculate monthly breakdown
  }
}

/**
 * Fetch historical data for forecasting
 */
async function fetchHistoricalData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  months: number
): Promise<MonthlyMetric[]> {
  const { data: plans } = await supabase
    .from('monthly_plans')
    .select('month, therapy_type_id, actual_sessions')
    .eq('user_id', userId)
    .order('month', { ascending: false })
    .limit(months)

  const { data: therapies } = await supabase
    .from('therapy_types')
    .select('id, price_per_session')
    .eq('user_id', userId)

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, month')
    .eq('user_id', userId)
    .order('month', { ascending: false })
    .limit(months)

  const therapyPriceMap = new Map(therapies?.map((t: any) => [t.id, t.price_per_session]) || [])
  const expensesByMonth = new Map(expenses?.map((e: any) => [e.month, e.amount]) || [])

  const monthlyData = new Map<string, MonthlyMetric>()

  plans?.forEach((plan: any) => {
    const month = plan.month
    if (!monthlyData.has(month)) {
      monthlyData.set(month, {
        month: new Date(month),
        totalRevenue: 0,
        totalExpenses: 0,
        totalSessions: 0,
        netIncome: 0,
        marginPercent: 0
      })
    }

    const metric = monthlyData.get(month)!
    const price = therapyPriceMap.get(plan.therapy_type_id) || 0
    metric.totalRevenue += (plan.actual_sessions || 0) * price
    metric.totalSessions += plan.actual_sessions || 0
  })

  // Add expenses
  monthlyData.forEach((metric, month) => {
    metric.totalExpenses = expensesByMonth.get(month) || 0
    metric.netIncome = metric.totalRevenue - metric.totalExpenses
    metric.marginPercent =
      metric.totalRevenue > 0
        ? (metric.netIncome / metric.totalRevenue) * 100
        : 0
  })

  return Array.from(monthlyData.values()).sort(
    (a, b) => a.month.getTime() - b.month.getTime()
  )
}

// ============================================================================
// Helper Functions: Metric Calculations
// ============================================================================

interface CalculatedMetrics {
  viabilityScore: ViabilityScore
  breakEvenStatus: 'surplus' | 'breakeven' | 'deficit'
  netIncome: number
  totalRevenue: number
  totalExpenses: number
  totalSessions: number
  totalPlannedSessions: number
  averageSessionPrice: number
  marginPercent: number
}

/**
 * Calculate all metrics from scope data
 */
function calculateMetrics(data: MetricsData): CalculatedMetrics {
  const viabilityScore = calculateViabilityScore({
    totalRevenue: data.totalRevenue,
    totalExpenses: data.totalExpenses,
    totalSessions: data.totalSessions,
    targetSessions: Math.max(data.totalPlannedSessions, 1),
    therapyCount: data.therapyMetrics.length,
    activeTherapyCount: data.therapyMetrics.filter(
      (t) => t.actualSessions > 0
    ).length
  })

  const marginResult = calculateMargin(data.totalRevenue, data.totalExpenses)

  const breakEvenStatus: 'surplus' | 'breakeven' | 'deficit' = marginResult.breakEven
    ? data.netIncome > 0
      ? 'surplus'
      : 'breakeven'
    : 'deficit'

  return {
    viabilityScore,
    breakEvenStatus,
    netIncome: marginResult.margin,
    totalRevenue: data.totalRevenue,
    totalExpenses: data.totalExpenses,
    totalSessions: data.totalSessions,
    totalPlannedSessions: data.totalPlannedSessions,
    averageSessionPrice: calculateAveragePricePerSession(
      data.therapyMetrics.map((t) => ({
        sessions: t.actualSessions,
        price: t.pricePerSession
      }))
    ),
    marginPercent: marginResult.marginPercent
  }
}

/**
 * Determine data quality based on available data
 */
function determineDataQuality(
  data: MetricsData,
  scope: MetricsScope
): 'complete' | 'partial' | 'insufficient' {
  if (data.totalSessions === 0 && data.therapyMetrics.length === 0) {
    return 'insufficient'
  }

  const activeTherapies = data.therapyMetrics.filter(
    (t) => t.actualSessions > 0
  ).length
  const utilization =
    activeTherapies / Math.max(data.therapyMetrics.length, 1)

  if (utilization < 0.5) {
    return 'partial'
  }

  return 'complete'
}
