/**
 * Forecasting utilities for revenue and metric predictions
 */

export interface ForecastResult {
  values: number[]
  confidenceInterval: {
    upper: number[]
    lower: number[]
  }
  slope: number
  intercept: number
  r2: number
  rmse: number
}

/**
 * Simple linear regression for forecasting
 * y = slope * x + intercept
 */
export function linearRegression(data: number[]): {
  slope: number
  intercept: number
  r2: number
} {
  const n = data.length
  if (n < 2) {
    return { slope: 0, intercept: data[0] || 0, r2: 0 }
  }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  let sumY2 = 0

  for (let i = 0; i < n; i++) {
    const x = i
    const y = data[i]
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
    sumY2 += y * y
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Calculate R²
  const yMean = sumY / n
  let ssRes = 0 // Sum of squared residuals
  let ssTot = 0 // Total sum of squares

  for (let i = 0; i < n; i++) {
    const yPredicted = slope * i + intercept
    const residual = data[i] - yPredicted
    ssRes += residual * residual
    ssTot += (data[i] - yMean) ** 2
  }

  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot

  return { slope, intercept, r2 }
}

/**
 * Forecast future values using linear regression
 */
export function forecast(
  historicalData: number[],
  periods: number,
  confidenceLevel: number = 0.95
): ForecastResult {
  const { slope, intercept, r2 } = linearRegression(historicalData)

  const forecastedValues: number[] = []
  const n = historicalData.length

  // Calculate RMSE for confidence intervals
  let sumSquaredErrors = 0
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept
    const error = historicalData[i] - predicted
    sumSquaredErrors += error * error
  }
  const rmse = Math.sqrt(sumSquaredErrors / n)

  // Calculate confidence interval multiplier
  let zScore = 1.96 // 95% confidence
  if (confidenceLevel === 0.9) zScore = 1.645
  else if (confidenceLevel === 0.99) zScore = 2.576

  // Generate forecasts
  const upper: number[] = []
  const lower: number[] = []

  for (let i = 0; i < periods; i++) {
    const x = n + i
    const predicted = slope * x + intercept
    const margin = zScore * rmse * Math.sqrt(1 + 1 / n + ((x - n / 2) ** 2) / (n * n))

    forecastedValues.push(Math.max(0, predicted))
    upper.push(Math.max(0, predicted + margin))
    lower.push(Math.max(0, predicted - margin))
  }

  return {
    values: forecastedValues,
    confidenceInterval: { upper, lower },
    slope,
    intercept,
    r2,
    rmse,
  }
}

/**
 * Forecast with exponential smoothing (more responsive to recent changes)
 */
export function exponentialSmoothing(
  data: number[],
  alpha: number = 0.3,
  periods: number = 6
): number[] {
  if (data.length === 0) return Array(periods).fill(0)

  const smoothed: number[] = [data[0]]
  for (let i = 1; i < data.length; i++) {
    smoothed.push(alpha * data[i] + (1 - alpha) * smoothed[i - 1])
  }

  // Forecast using last smoothed value
  const lastValue = smoothed[smoothed.length - 1]
  const forecast: number[] = Array(periods).fill(lastValue)

  return forecast
}

/**
 * Calculate trend from data
 * Returns number between -1 and 1 (negative = decreasing, positive = increasing)
 */
export function calculateTrend(data: number[]): number {
  if (data.length < 2) return 0

  const { slope } = linearRegression(data)
  const mean = data.reduce((a, b) => a + b, 0) / data.length
  const avgChangePercent = mean > 0 ? (slope / mean) * 100 : 0

  // Normalize to -1 to 1 range
  return Math.max(-1, Math.min(1, avgChangePercent / 100))
}

/**
 * Calculate breakeven point (months until revenue >= costs)
 */
export function calculateBreakevenMonths(
  revenueData: number[],
  costData: number[],
  fixedCosts: number = 0
): number {
  const revenueSlope = linearRegression(revenueData).slope
  const costSlope = linearRegression(costData).slope

  if (revenueSlope === 0) return Infinity

  const n = revenueData.length
  const currentRevenue = revenueData[n - 1] || 0
  const currentCost = costData[n - 1] || 0

  const monthlyNetChange = revenueSlope - costSlope
  if (monthlyNetChange <= 0) return Infinity

  const deficit = Math.max(0, currentCost + fixedCosts - currentRevenue)
  return Math.ceil(deficit / monthlyNetChange)
}

/**
 * Forecast metrics with optional baseline
 */
export function forecastMetric(
  historicalValues: number[],
  periods: number = 3,
  baseline?: number
): {
  forecast: number[]
  breakpoint?: number
} {
  const result = forecast(historicalValues, periods)

  // Check if forecast crosses baseline
  let breakpoint: number | undefined
  if (baseline !== undefined) {
    for (let i = 0; i < result.values.length; i++) {
      if (
        (historicalValues[historicalValues.length - 1] < baseline &&
          result.values[i] >= baseline) ||
        (historicalValues[historicalValues.length - 1] > baseline &&
          result.values[i] <= baseline)
      ) {
        breakpoint = i + 1
        break
      }
    }
  }

  return {
    forecast: result.values,
    breakpoint,
  }
}
