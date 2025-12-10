/**
 * Forecast Calculator
 * Projects future revenue and metrics based on historical trends
 *
 * NOTE: All revenue forecasts are GROSS revenue. When calculating profit/break-even,
 * payment fees must be applied using calculateNetRevenue from payment-fees.ts.
 */

import type { ForecastDataPoint } from '../types'
import { calculateNetRevenue, SUMUP_FEE_RATE } from '../payment-fees'

export interface HistoricalMetrics {
  month: Date
  revenue: number
  sessions: number
  expenses: number
}

/**
 * Calculate linear trend forecast for revenue
 * Uses least squares regression on historical data
 *
 * @param historicalData Array of historical monthly metrics
 * @param monthsAhead Number of months to forecast
 * @returns Array of forecast data points with confidence bands
 */
export function calculateForecast(
  historicalData: HistoricalMetrics[],
  monthsAhead: number = 6
): ForecastDataPoint[] {
  if (historicalData.length < 2) {
    return generateEmptyForecast(monthsAhead)
  }

  const revenues = historicalData.map((d) => d.revenue)
  const n = revenues.length

  // Calculate means
  const xMean = (n - 1) / 2
  const yMean = revenues.reduce((sum, r) => sum + r, 0) / n

  // Calculate slope and intercept using least squares
  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean
    numerator += xDiff * (revenues[i] - yMean)
    denominator += xDiff * xDiff
  }

  const slope = denominator !== 0 ? numerator / denominator : 0
  const intercept = yMean - slope * xMean

  // Generate forecasts
  const forecasts: ForecastDataPoint[] = []

  for (let i = 1; i <= monthsAhead; i++) {
    const forecastValue = slope * (n + i - 1) + intercept
    const confidence = calculateConfidence(n, i)
    const volatility = calculateVolatility(revenues)

    const upperBound = forecastValue * (1 + volatility * (2 - confidence))
    const lowerBound = forecastValue * (1 - volatility * (2 - confidence))

    const month = new Date(historicalData[n - 1].month)
    month.setMonth(month.getMonth() + i)

    forecasts.push({
      month,
      forecastedRevenue: Math.max(0, forecastValue),
      confidence,
      upperBound: Math.max(0, upperBound),
      lowerBound: Math.max(0, lowerBound)
    })
  }

  return forecasts
}

/**
 * Calculate forecast confidence based on data points and lookahead
 * Confidence decreases further into the future
 *
 * @param dataPoints Number of historical data points
 * @param monthsAhead Months being forecast
 * @returns Confidence as decimal (0.5 to 0.95)
 */
function calculateConfidence(dataPoints: number, monthsAhead: number): number {
  // Base confidence from data points (more data = higher confidence)
  const baseConfidence = Math.min(0.95, 0.5 + (dataPoints * 0.05))

  // Decay confidence as we look further ahead
  const decayFactor = Math.pow(0.95, monthsAhead - 1)

  return baseConfidence * decayFactor
}

/**
 * Calculate volatility (standard deviation) of historical revenue
 * @param revenues Array of historical revenues
 * @returns Volatility as percentage of mean
 */
function calculateVolatility(revenues: number[]): number {
  if (revenues.length < 2) return 0.1 // Default 10% if insufficient data

  const mean = revenues.reduce((sum, r) => sum + r, 0) / revenues.length

  if (mean === 0) return 0

  const variance =
    revenues.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    revenues.length

  const stdDev = Math.sqrt(variance)
  return stdDev / mean
}

/**
 * Generate empty forecast when insufficient data
 * @param monthsAhead Months to forecast
 * @returns Array of neutral forecast points
 */
function generateEmptyForecast(monthsAhead: number): ForecastDataPoint[] {
  const forecasts: ForecastDataPoint[] = []
  const baseDate = new Date()

  for (let i = 1; i <= monthsAhead; i++) {
    const month = new Date(baseDate)
    month.setMonth(month.getMonth() + i)

    forecasts.push({
      month,
      forecastedRevenue: 0,
      confidence: 0.5,
      upperBound: 0,
      lowerBound: 0
    })
  }

  return forecasts
}

/**
 * Calculate break-even month based on forecast
 *
 * IMPORTANT: This uses NET revenue (after payment fees) for break-even calculation.
 * The forecasted revenue is gross, so we apply the payment fee deduction before
 * comparing against fixed costs.
 *
 * Break-even is reached when: Net Revenue >= Fixed Costs
 * Where: Net Revenue = Gross Revenue * (1 - SUMUP_FEE_RATE)
 *
 * @param forecast Array of forecast data points (with GROSS revenue)
 * @param fixedCosts Monthly fixed costs
 * @returns Month when break-even is projected, or null if not projecting break-even
 */
export function calculateBreakEvenMonth(
  forecast: ForecastDataPoint[],
  fixedCosts: number
): Date | null {
  for (const point of forecast) {
    // Apply payment fees to get net revenue before comparing to costs
    const netRevenue = calculateNetRevenue(point.forecastedRevenue)
    if (netRevenue >= fixedCosts) {
      return point.month
    }
  }
  return null
}

/**
 * Calculate revenue trend (growth or decline)
 * @param historicalData Array of historical metrics
 * @returns Trend as percentage month-over-month
 */
export function calculateRevenueTrend(historicalData: HistoricalMetrics[]): number {
  if (historicalData.length < 2) return 0

  const recent = historicalData[historicalData.length - 1].revenue
  const previous = historicalData[historicalData.length - 2].revenue

  if (previous === 0) {
    return recent > 0 ? 100 : 0
  }

  return ((recent - previous) / previous) * 100
}

/**
 * Identify inflection points (significant changes in trend)
 * @param historicalData Array of historical metrics
 * @returns Array of months where trend changed significantly
 */
export function identifyTrendChanges(
  historicalData: HistoricalMetrics[]
): Array<{ month: Date; changePercent: number }> {
  if (historicalData.length < 3) return []

  const changes = []

  for (let i = 1; i < historicalData.length - 1; i++) {
    const prev = historicalData[i - 1].revenue
    const curr = historicalData[i].revenue
    const next = historicalData[i + 1].revenue

    const prevTrend = prev > 0 ? ((curr - prev) / prev) * 100 : 0
    const nextTrend = curr > 0 ? ((next - curr) / curr) * 100 : 0

    const trendChange = nextTrend - prevTrend

    // Flag if trend change > 20 percentage points
    if (Math.abs(trendChange) > 20) {
      changes.push({
        month: historicalData[i].month,
        changePercent: trendChange
      })
    }
  }

  return changes
}

/**
 * Forecast break-even date given expenses
 *
 * NOTE: Uses NET revenue (after payment fees) for break-even calculation.
 * The 1.39% SumUp fee is automatically deducted from gross forecasted revenue.
 *
 * @param historicalData Historical revenue for trend (gross revenue)
 * @param targetExpenses Monthly expenses (fixed costs)
 * @param monthsAhead How many months to forecast
 * @returns Estimated month when break-even is reached (using net revenue), or null
 */
export function forecastBreakEvenDate(
  historicalData: HistoricalMetrics[],
  targetExpenses: number,
  monthsAhead: number = 12
): Date | null {
  const forecast = calculateForecast(historicalData, monthsAhead)
  return calculateBreakEvenMonth(forecast, targetExpenses)
}

/**
 * Calculate confidence band width (for visualization)
 * @param forecast Forecast data point
 * @returns Width of confidence band as percentage
 */
export function getConfidenceBandWidth(forecast: ForecastDataPoint[]): number[] {
  return forecast.map((point) => {
    const range = point.upperBound - point.lowerBound
    return point.forecastedRevenue > 0
      ? (range / point.forecastedRevenue) * 100
      : 0
  })
}

/**
 * Compare forecast to plan for risk assessment
 *
 * NOTE: Uses NET revenue (after payment fees) for risk comparison.
 * The forecast lower bound (gross) is adjusted for 1.39% payment fee.
 *
 * @param forecast Forecast data points (gross revenue)
 * @param plannedRevenue Planned monthly revenue (gross)
 * @returns Risk assessment
 */
export function assessForecastRisk(
  forecast: ForecastDataPoint[],
  plannedRevenue: number
): {
  riskLevel: 'low' | 'medium' | 'high'
  description: string
  monthsAtRisk: number
} {
  let monthsAtRisk = 0

  // Apply payment fees to both the forecast lower bound and planned revenue
  // for accurate comparison of net revenue risk
  const netPlannedRevenue = calculateNetRevenue(plannedRevenue)

  for (const point of forecast) {
    const netLowerBound = calculateNetRevenue(point.lowerBound)
    if (netLowerBound < netPlannedRevenue * 0.8) {
      monthsAtRisk++
    }
  }

  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  let description = 'Forecast indicates strong performance'

  if (monthsAtRisk >= forecast.length * 0.5) {
    riskLevel = 'high'
    description = 'Over half of forecast period at risk of underperforming plan'
  } else if (monthsAtRisk > 0) {
    riskLevel = 'medium'
    description = 'Some months projected below plan - monitoring recommended'
  }

  return {
    riskLevel,
    description,
    monthsAtRisk
  }
}
