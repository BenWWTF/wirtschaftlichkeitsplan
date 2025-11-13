/**
 * KPI Calculation Helpers
 * Utilities for computing key performance indicators
 */

export interface KPIValues {
  occupancyRate: number
  revenuePerSession: number
  costPerSession: number
  profitMarginPercent: number
  costTrend: number | null
  revenueTrend: number | null
  breakEvenDistance: number
}

/**
 * Calculate occupancy rate (actual vs planned sessions)
 */
export function calculateOccupancyRate(
  actualSessions: number,
  plannedSessions: number
): number {
  if (plannedSessions === 0) return 0
  return (actualSessions / plannedSessions) * 100
}

/**
 * Calculate average revenue per session
 */
export function calculateRevenuePerSession(
  totalRevenue: number,
  totalSessions: number
): number {
  if (totalSessions === 0) return 0
  return totalRevenue / totalSessions
}

/**
 * Calculate average cost per session
 */
export function calculateCostPerSession(
  totalCosts: number,
  totalSessions: number
): number {
  if (totalSessions === 0) return 0
  return totalCosts / totalSessions
}

/**
 * Calculate profit margin as percentage
 */
export function calculateProfitMarginPercent(
  netIncome: number,
  totalRevenue: number
): number {
  if (totalRevenue === 0) return 0
  return (netIncome / totalRevenue) * 100
}

/**
 * Calculate trend percentage change
 */
export function calculateTrendPercent(
  current: number,
  previous: number
): number | null {
  if (previous === 0) return null
  if (current === 0 && previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

/**
 * Calculate break-even distance in sessions
 */
export function calculateBreakEvenDistance(
  fixedCosts: number,
  contributionMarginPerSession: number
): number {
  if (contributionMarginPerSession <= 0) return Infinity
  return fixedCosts / contributionMarginPerSession
}

/**
 * Calculate contribution margin
 */
export function calculateContributionMargin(
  revenue: number,
  variableCosts: number
): number {
  return revenue - variableCosts
}

/**
 * Calculate average therapy price
 */
export function calculateAverageTherapyPrice(therapyPrices: number[]): number {
  if (therapyPrices.length === 0) return 0
  const sum = therapyPrices.reduce((a, b) => a + b, 0)
  return sum / therapyPrices.length
}

/**
 * Forecast next month revenue based on trend
 */
export function forecastRevenue(
  monthlyRevenues: number[],
  growthFactor: number = 1.0
): number {
  if (monthlyRevenues.length === 0) return 0
  const lastMonth = monthlyRevenues[monthlyRevenues.length - 1]
  const avg = monthlyRevenues.reduce((a, b) => a + b, 0) / monthlyRevenues.length
  const trend = lastMonth > avg ? 1.1 : lastMonth < avg ? 0.9 : 1.0
  return lastMonth * trend * growthFactor
}

/**
 * Calculate weighted average contribution margin
 */
export function calculateWeightedContributionMargin(
  therapySessions: { sessions: number; margin: number }[]
): number {
  const totalSessions = therapySessions.reduce((sum, t) => sum + t.sessions, 0)
  if (totalSessions === 0) return 0
  const weightedSum = therapySessions.reduce(
    (sum, t) => sum + t.sessions * t.margin,
    0
  )
  return weightedSum / totalSessions
}

/**
 * Determine profitability status
 */
export function getProfiabilityStatus(
  netIncome: number
): 'surplus' | 'breakeven' | 'deficit' {
  if (netIncome > 100) return 'surplus'
  if (netIncome >= -100) return 'breakeven'
  return 'deficit'
}

/**
 * Format percentage value
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Determine trend direction
 */
export function getTrendDirection(change: number | null): 'up' | 'down' | 'flat' {
  if (change === null) return 'flat'
  if (change > 1) return 'up'
  if (change < -1) return 'down'
  return 'flat'
}
