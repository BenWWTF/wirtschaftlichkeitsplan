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
import { calculateAustrianTax } from '@/lib/utils/austrian-tax'

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
  dataViewMode?: 'prognose' | 'resultate'
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
  totalRevenue: number // Gross revenue before payment fees
  totalPaymentFees: number // Total payment processing fees (SumUp)
  totalNetRevenue: number // Net revenue after payment fees
  paymentFeePercentage: number // Fee percentage used (e.g., 1.39)
  totalExpenses: number // Fixed and variable costs
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

  // Get authenticated user if userId not provided
  let userId = input.userId
  if (!userId) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    userId = user?.id || '00000000-0000-0000-0000-000000000000'
  }

  try {
    // 1. Determine period dates
    const period = getPeriodDates(input.scope, input.date)

    // 2. Fetch raw data for the period
    const scopeData = await fetchScopeData(supabase, userId, input.scope, period, input.dataViewMode)

    // 3. Fetch comparison data if requested
    let comparisonData: MetricsData | null = null
    let comparisonPeriod: { start: Date; end: Date } | null = null
    if (input.compareMode && input.compareMode !== 'none') {
      const comparison = getComparisonPeriod(
        input.scope,
        input.date,
        input.compareMode
      )
      // Always fetch actual data for comparison (variance detection)
      comparisonData = await fetchScopeData(supabase, userId, input.scope, comparison, 'resultate')
      comparisonPeriod = comparison
    }

    // 4. Calculate all metrics using pure functions
    const calculatedMetrics = calculateMetrics(scopeData, input.dataViewMode)

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
      totalPaymentFees: calculatedMetrics.totalPaymentFees,
      totalNetRevenue: calculatedMetrics.totalNetRevenue,
      paymentFeePercentage: calculatedMetrics.paymentFeePercentage,
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
  period: { start: Date; end: Date },
  dataViewMode?: 'prognose' | 'resultate'
): Promise<MetricsData> {
  // Fetch user settings (for practice type, tax calculations, and payment fee percentage)
  const { data: userSettings } = await supabase
    .from('practice_settings')
    .select('practice_type, payment_processing_fee_percentage')
    .eq('user_id', userId)
    .single()

  const practiceType = (userSettings?.practice_type as 'kassenarzt' | 'wahlarzt' | 'mixed') || 'wahlarzt'
  // Default to 1.39% (SumUp standard fee) if not set
  const paymentFeePercentage = userSettings?.payment_processing_fee_percentage ?? 1.39

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

  // Fetch expenses with recurring/annual payment info
  // For recurring expenses, we need ALL of them (not just those created in this period)
  // One-time expenses: filter by date range
  // Recurring expenses: include all that have is_recurring = true
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, expense_date, is_recurring, recurrence_interval')
    .eq('user_id', userId)
    .or(`is_recurring.eq.true,and(is_recurring.eq.false,expense_date.gte.${period.start.toISOString().split('T')[0]},expense_date.lte.${period.end.toISOString().split('T')[0]})`)

  // Calculate total expenses with proration for recurring/annual expenses
  let totalExpenses = 0
  if (expenses && expenses.length > 0) {
    const monthsInPeriod = Math.max(1, Math.round((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))

    expenses.forEach((expense: any) => {
      const amount = expense.amount || 0

      // If not recurring, add as-is
      if (!expense.is_recurring) {
        totalExpenses += amount
        return
      }

      // If recurring, prorate based on interval
      switch (expense.recurrence_interval) {
        case 'daily':
          // Add for each day in the period (approximate: days_in_period = months_in_period * 30.44)
          const daysInPeriod = Math.round(monthsInPeriod * 30.44)
          totalExpenses += amount * daysInPeriod
          break

        case 'weekly':
          // Add for each week in the period (weeks = months_in_period * 4.34)
          const weeksInPeriod = Math.round(monthsInPeriod * 4.34)
          totalExpenses += amount * weeksInPeriod
          break

        case 'monthly':
          // Add for each month in the period
          totalExpenses += amount * monthsInPeriod
          break

        case 'quarterly':
          // Add for each quarter in the period (quarters = months_in_period / 3)
          const quartersInPeriod = Math.round(monthsInPeriod / 3)
          totalExpenses += amount * Math.max(1, quartersInPeriod)
          break

        case 'yearly':
        case 'annual':
          // Prorate annual amount across the period
          // Recurring expenses should appear every year, not just when created
          const proratedAmount = (amount / 12) * monthsInPeriod
          totalExpenses += proratedAmount
          break

        default:
          // Unknown interval, treat as one-time
          totalExpenses += amount
      }
    })
  }

  // Aggregate data by therapy type
  const therapyMap = new Map<string, TherapyMetric>()
  // Use planned sessions for revenue calculation in prognose mode, actual otherwise
  const useActualSessions = dataViewMode !== 'prognose'

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

      // Use appropriate session count based on data view mode
      const sessionsForRevenue = useActualSessions ? totalActual : totalPlanned

      const totalRevenue = calculateSessionRevenue(
        sessionsForRevenue,
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
        totalMargin: sessionsForRevenue * margin.margin,
        marginPercent: margin.marginPercent,
        utilizationRate: sessionMetrics.utilizationRate
      })
    })
  }

  const therapyMetrics = Array.from(therapyMap.values())

  // Calculate totals
  const totalRevenue = therapyMetrics.reduce((sum, t) => sum + t.totalRevenue, 0)
  // Use appropriate sessions count based on data view mode
  const totalSessions = useActualSessions
    ? therapyMetrics.reduce((sum, t) => sum + t.actualSessions, 0)
    : therapyMetrics.reduce((sum, t) => sum + t.plannedSessions, 0)
  const totalPlanned = therapyMetrics.reduce(
    (sum, t) => sum + t.plannedSessions,
    0
  )

  // Calculate payment fees
  const totalPaymentFees = totalRevenue * (paymentFeePercentage / 100)
  const totalNetRevenue = totalRevenue - totalPaymentFees

  const grossIncome = totalNetRevenue - totalExpenses

  // Calculate number of months in the period for prorating annual tax contributions
  const monthsInPeriod = Math.max(1, Math.round((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))

  // Calculate net income after taxes (Austrian practice)
  // Note: We use net revenue (after payment fees) as the gross revenue for tax calculation
  const taxResult = calculateAustrianTax({
    grossRevenue: totalNetRevenue,
    totalExpenses: totalExpenses,
    practiceType: practiceType,
    applyingPauschalierung: totalNetRevenue < 220000, // Eligible if under €220k
    monthsInPeriod: monthsInPeriod
  })

  const netIncome = taxResult.netIncome
  const marginPercent = totalRevenue > 0 ? (grossIncome / totalRevenue) * 100 : 0

  return {
    totalRevenue,
    totalPaymentFees,
    totalNetRevenue,
    paymentFeePercentage,
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
    .select('amount, expense_date, is_recurring, recurrence_interval')
    .eq('user_id', userId)
    .order('expense_date', { ascending: false })
    .limit(months * 10) // Fetch more to account for recurring expenses

  const therapyPriceMap = new Map(therapies?.map((t: any) => [t.id, t.price_per_session]) || [])
  const expensesByMonth = new Map(expenses?.map((e: any) => {
    const dateStr = e.expense_date
    return [dateStr, (e.amount || 0)]
  }) || [])

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
  totalPaymentFees: number
  totalNetRevenue: number
  paymentFeePercentage: number
  totalExpenses: number
  totalSessions: number
  totalPlannedSessions: number
  averageSessionPrice: number
  marginPercent: number
}

/**
 * Calculate all metrics from scope data
 */
function calculateMetrics(data: MetricsData, dataViewMode: 'prognose' | 'resultate' = 'resultate'): CalculatedMetrics {
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

  // Use net revenue (after payment fees) for margin calculation
  const marginResult = calculateMargin(data.totalNetRevenue, data.totalExpenses)

  const breakEvenStatus: 'surplus' | 'breakeven' | 'deficit' = marginResult.breakEven
    ? data.netIncome > 0
      ? 'surplus'
      : 'breakeven'
    : 'deficit'

  return {
    viabilityScore,
    breakEvenStatus,
    netIncome: data.netIncome,
    totalRevenue: data.totalRevenue,
    totalPaymentFees: data.totalPaymentFees,
    totalNetRevenue: data.totalNetRevenue,
    paymentFeePercentage: data.paymentFeePercentage,
    totalExpenses: data.totalExpenses,
    totalSessions: data.totalSessions,
    totalPlannedSessions: data.totalPlannedSessions,
    averageSessionPrice: calculateAveragePricePerSession(
      data.therapyMetrics.map((t) => ({
        sessions: dataViewMode === 'prognose' ? t.plannedSessions : t.actualSessions,
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
