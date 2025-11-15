/**
 * Core types for calculation layer
 * These are shared across all calculators and form the contract for data passing
 */

/**
 * Result of session metrics calculation
 */
export interface SessionMetrics {
  plannedSessions: number
  actualSessions: number
  variance: number
  variancePercent: number
  utilizationRate: number
}

/**
 * Result of revenue calculation for a single session type
 */
export interface SessionRevenue {
  revenue: number
  sessions: number
  pricePerSession: number
  averagePrice: number
}

/**
 * Result of margin calculation
 */
export interface MarginResult {
  revenue: number
  totalCost: number
  margin: number
  marginPercent: number
  breakEven: boolean
}

/**
 * Contribution margin per session (for profitability analysis)
 */
export interface ContributionMargin {
  pricePerSession: number
  variableCostPerSession: number
  margin: number
  marginPercent: number
}

/**
 * Viability score breakdown
 */
export interface ViabilityScore {
  score: number // 0-100
  revenueRatio: number
  therapyUtilization: number
  sessionUtilization: number
  expenseManagement: number
  status: 'critical' | 'caution' | 'healthy'
}

/**
 * Alert for variance detection
 */
export interface VarianceAlert {
  id: string
  type:
    | 'REVENUE_BELOW_PLAN'
    | 'REVENUE_ABOVE_PLAN'
    | 'THERAPY_UNDERUTILIZED'
    | 'THERAPY_OPPORTUNITY'
    | 'EXPENSE_OVERRUN'
    | 'MARGIN_DECLINING'
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  metric: string
  currentValue: number
  expectedValue: number
  variance: number
  variancePercent: number
  actionItems: string[]
}

/**
 * Therapy metric for breakdown analysis
 */
export interface TherapyMetric {
  id: string
  name: string
  plannedSessions: number
  actualSessions: number
  pricePerSession: number
  variableCostPerSession: number
  totalRevenue: number
  totalMargin: number
  marginPercent: number
  utilizationRate: number
}

/**
 * Monthly breakdown of metrics
 */
export interface MonthlyMetric {
  month: Date
  totalRevenue: number
  totalExpenses: number
  totalSessions: number
  netIncome: number
  marginPercent: number
}

/**
 * Forecast data point
 */
export interface ForecastDataPoint {
  month: Date
  forecastedRevenue: number
  confidence: number
  upperBound: number
  lowerBound: number
}

/**
 * Complete metrics data for a scope
 */
export interface MetricsData {
  totalRevenue: number
  totalExpenses: number
  totalSessions: number
  totalPlannedSessions: number
  netIncome: number
  marginPercent: number
  therapyMetrics: TherapyMetric[]
  monthlyBreakdown?: MonthlyMetric[]
}
