/**
 * Margin Calculator
 * Pure functions for calculating profitability and margin metrics
 * Now includes fee-aware calculations for payment processing fees (e.g., SumUp 1.39%)
 */

import type { MarginResult, ContributionMargin } from '../types'
import { calculateNetContributionMargin, calculateBreakEvenSessionsWithFees, calculateProfitWithFees, calculateProfitMarginWithFees } from '../payment-fees'

/**
 * Calculate margin (profit/loss)
 * Core formula: margin = revenue - (variable_cost + fixed_cost)
 *
 * @param revenue Total revenue
 * @param variableCost Variable costs (e.g., per-session costs)
 * @param fixedCost Fixed costs (optional, defaults to 0)
 * @returns MarginResult with breakdown and break-even status
 */
export function calculateMargin(
  revenue: number,
  variableCost: number,
  fixedCost: number = 0
): MarginResult {
  const totalCost = variableCost + fixedCost
  const margin = revenue - totalCost
  const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0
  const breakEven = revenue >= totalCost

  return {
    revenue,
    totalCost,
    margin,
    marginPercent,
    breakEven
  }
}

/**
 * Calculate contribution margin per session
 * Contribution margin = price per session - variable cost per session
 *
 * @param pricePerSession Price per individual session
 * @param variableCostPerSession Variable cost per session
 * @returns ContributionMargin with percentage
 */
export function calculateContributionMargin(
  pricePerSession: number,
  variableCostPerSession: number
): ContributionMargin {
  const margin = pricePerSession - variableCostPerSession
  const marginPercent =
    pricePerSession > 0 ? (margin / pricePerSession) * 100 : 0

  return {
    pricePerSession,
    variableCostPerSession,
    margin,
    marginPercent
  }
}

/**
 * Calculate total margin from multiple therapy types
 * @param therapyData Array of {revenue, variable_cost}
 * @returns Total margin across all therapies
 */
export function calculateTotalMargin(
  therapyData: Array<{ revenue: number; variableCost: number }>
): number {
  return therapyData.reduce((sum, therapy) => {
    return sum + (therapy.revenue - therapy.variableCost)
  }, 0)
}

/**
 * Calculate margin percentage across all therapies
 * @param totalRevenue Total revenue from all sources
 * @param totalMargin Total margin (after variable costs)
 * @returns Margin percentage (0-100 or negative)
 */
export function calculateMarginPercent(
  totalRevenue: number,
  totalMargin: number
): number {
  if (totalRevenue === 0) return 0
  return (totalMargin / totalRevenue) * 100
}

/**
 * Calculate break-even point (sessions needed to break even)
 * Formula: break_even_sessions = fixed_cost / contribution_margin
 *
 * @param fixedCost Monthly fixed costs
 * @param contributionMarginPerSession Contribution margin per session
 * @returns Number of sessions needed to break even
 */
export function calculateBreakEvenSessions(
  fixedCost: number,
  contributionMarginPerSession: number
): number {
  if (contributionMarginPerSession <= 0) {
    return Infinity
  }
  return fixedCost / contributionMarginPerSession
}

/**
 * Calculate profit at different session volumes
 * @param sessionsCompleted Sessions actually completed
 * @param contributionMarginPerSession Contribution margin per session
 * @param fixedCost Fixed costs
 * @returns Net profit/loss
 */
export function calculateProfitAtVolume(
  sessionsCompleted: number,
  contributionMarginPerSession: number,
  fixedCost: number
): number {
  return sessionsCompleted * contributionMarginPerSession - fixedCost
}

/**
 * Calculate sessions needed to reach a profit target
 * @param profitTarget Target profit to achieve
 * @param contributionMarginPerSession Contribution margin per session
 * @param fixedCost Fixed costs
 * @returns Sessions needed to achieve target
 */
export function calculateSessionsForProfitTarget(
  profitTarget: number,
  contributionMarginPerSession: number,
  fixedCost: number
): number {
  if (contributionMarginPerSession <= 0) {
    return Infinity
  }
  return (profitTarget + fixedCost) / contributionMarginPerSession
}

/**
 * Calculate profitability ratio (profit / revenue)
 * @param profit Net profit/loss
 * @param revenue Total revenue
 * @returns Profitability ratio as percentage
 */
export function calculateProfitabilityRatio(
  profit: number,
  revenue: number
): number {
  if (revenue === 0) return 0
  return (profit / revenue) * 100
}

/**
 * Determine if margin is declining (trend analysis)
 * @param currentMarginPercent Current period margin %
 * @param previousMarginPercent Previous period margin %
 * @returns true if margin is declining
 */
export function isMarginDeclining(
  currentMarginPercent: number,
  previousMarginPercent: number
): boolean {
  return currentMarginPercent < previousMarginPercent
}

/**
 * Calculate margin trend
 * @param currentMargin Current margin
 * @param previousMargin Previous margin
 * @returns Percentage change in margin
 */
export function calculateMarginTrend(
  currentMargin: number,
  previousMargin: number
): number {
  if (previousMargin === 0) {
    return currentMargin > 0 ? 100 : 0
  }
  return ((currentMargin - previousMargin) / Math.abs(previousMargin)) * 100
}

/**
 * Calculate contribution margin per session AFTER payment fees
 * Net contribution margin = (price per session - fee) - variable cost per session
 *
 * @param pricePerSession Gross price per individual session
 * @param variableCostPerSession Variable cost per session
 * @param paymentFeePercentage Payment processing fee percentage (e.g., 1.39)
 * @returns ContributionMargin with net values after fees
 */
export function calculateContributionMarginAfterFees(
  pricePerSession: number,
  variableCostPerSession: number,
  paymentFeePercentage: number = 0
): ContributionMargin {
  const netMargin = calculateNetContributionMargin(
    pricePerSession,
    variableCostPerSession,
    paymentFeePercentage
  )
  const marginPercent =
    pricePerSession > 0 ? (netMargin / pricePerSession) * 100 : 0

  return {
    pricePerSession: netMargin,
    variableCostPerSession,
    margin: netMargin,
    marginPercent
  }
}

/**
 * Calculate break-even sessions AFTER payment fees
 * Accounts for net revenue after fee deduction
 *
 * @param fixedCost Monthly fixed costs
 * @param pricePerSession Gross session price
 * @param variableCostPerSession Variable cost per session
 * @param paymentFeePercentage Payment processing fee percentage
 * @returns Number of sessions needed to break even (after fees)
 */
export function calculateBreakEvenSessionsAfterFees(
  fixedCost: number,
  pricePerSession: number,
  variableCostPerSession: number,
  paymentFeePercentage: number = 0
): number {
  return calculateBreakEvenSessionsWithFees(
    fixedCost,
    pricePerSession,
    variableCostPerSession,
    paymentFeePercentage
  )
}

/**
 * Calculate profit at different session volumes AFTER fees
 * @param sessionsCompleted Sessions actually completed
 * @param pricePerSession Gross session price
 * @param variableCostPerSession Variable cost per session
 * @param fixedCost Fixed costs
 * @param paymentFeePercentage Payment processing fee percentage
 * @returns Net profit/loss after fees
 */
export function calculateProfitAtVolumeAfterFees(
  sessionsCompleted: number,
  pricePerSession: number,
  variableCostPerSession: number,
  fixedCost: number,
  paymentFeePercentage: number = 0
): number {
  return calculateProfitWithFees(
    sessionsCompleted,
    pricePerSession,
    variableCostPerSession,
    fixedCost,
    paymentFeePercentage
  )
}

/**
 * Calculate sessions needed to reach a profit target AFTER fees
 * @param profitTarget Target profit to achieve
 * @param pricePerSession Gross session price
 * @param variableCostPerSession Variable cost per session
 * @param fixedCost Fixed costs
 * @param paymentFeePercentage Payment processing fee percentage
 * @returns Sessions needed to achieve target (after fees)
 */
export function calculateSessionsForProfitTargetAfterFees(
  profitTarget: number,
  pricePerSession: number,
  variableCostPerSession: number,
  fixedCost: number,
  paymentFeePercentage: number = 0
): number {
  const netContributionMargin = calculateNetContributionMargin(
    pricePerSession,
    variableCostPerSession,
    paymentFeePercentage
  )

  if (netContributionMargin <= 0) {
    return Infinity
  }
  return (profitTarget + fixedCost) / netContributionMargin
}

/**
 * Calculate profitability ratio AFTER fees
 * @param sessions Number of sessions
 * @param pricePerSession Gross session price
 * @param variableCostPerSession Variable cost per session
 * @param fixedCost Fixed costs
 * @param paymentFeePercentage Payment processing fee percentage
 * @returns Profitability ratio as percentage
 */
export function calculateProfitabilityRatioAfterFees(
  sessions: number,
  pricePerSession: number,
  variableCostPerSession: number,
  fixedCost: number,
  paymentFeePercentage: number = 0
): number {
  return calculateProfitMarginWithFees(
    sessions,
    pricePerSession,
    variableCostPerSession,
    fixedCost,
    paymentFeePercentage
  )
}
