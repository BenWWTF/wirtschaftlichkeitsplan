/**
 * Payment Fee Calculator
 *
 * Pure functions for calculating SumUp payment fees and related metrics.
 * SumUp charges 1.39% per transaction for card payments.
 *
 * This module provides utilities for:
 * - Fee calculation on gross amounts
 * - Net revenue calculation after fees
 * - Break-even analysis with fees
 * - Growth projections with fee impact
 */

/**
 * SumUp transaction fee rate (1.39%)
 */
export const SUMUP_FEE_RATE = 0.0139;

/**
 * Calculate the SumUp payment fee for a gross amount
 *
 * @param grossAmount - The gross amount before fees (in EUR)
 * @returns The payment fee amount (in EUR)
 *
 * @example
 * calculatePaymentFee(100) // returns 1.39
 * calculatePaymentFee(85)  // returns 1.1815
 */
export function calculatePaymentFee(grossAmount: number): number {
  return grossAmount * SUMUP_FEE_RATE;
}

/**
 * Calculate net revenue after payment fees
 *
 * @param grossAmount - The gross amount before fees (in EUR)
 * @returns The net amount after fee deduction (in EUR)
 *
 * @example
 * calculateNetRevenue(100) // returns 98.61
 */
export function calculateNetRevenue(grossAmount: number): number {
  return grossAmount - calculatePaymentFee(grossAmount);
}

/**
 * Calculate net revenue per session after payment fees
 * Alias for calculateNetRevenue, semantically clearer for session-based pricing
 *
 * @param pricePerSession - The session price before fees (in EUR)
 * @returns The net revenue per session after fee deduction (in EUR)
 *
 * @example
 * calculateNetRevenuePerSession(85) // returns ~83.82
 */
export function calculateNetRevenuePerSession(pricePerSession: number): number {
  return calculateNetRevenue(pricePerSession);
}

/**
 * Calculate the number of sessions needed to break even, accounting for payment fees
 *
 * @param fixedCosts - Total fixed costs to cover (in EUR)
 * @param pricePerSession - Price per session before fees (in EUR)
 * @returns The number of sessions needed (rounded up to whole sessions)
 *
 * @example
 * calculateBreakEvenSessions(1000, 85) // returns 12
 */
export function calculateBreakEvenSessions(
  fixedCosts: number,
  pricePerSession: number
): number {
  if (fixedCosts === 0) return 0;
  if (pricePerSession === 0) return Infinity;

  const netPerSession = calculateNetRevenuePerSession(pricePerSession);
  return Math.ceil(fixedCosts / netPerSession);
}

/**
 * Calculate monthly profit after payment fees and fixed costs
 *
 * @param grossRevenue - Gross monthly revenue (in EUR)
 * @param fixedCosts - Monthly fixed costs (in EUR)
 * @returns Monthly profit (can be negative if costs exceed revenue)
 *
 * @example
 * calculateMonthlyProfit(5000, 2000) // returns ~2930.50
 */
export function calculateMonthlyProfit(
  grossRevenue: number,
  fixedCosts: number
): number {
  const netRevenue = calculateNetRevenue(grossRevenue);
  return netRevenue - fixedCosts;
}

/**
 * Project gross revenue for a specific month with compound growth
 *
 * @param startingGross - Starting monthly gross revenue (in EUR)
 * @param monthlyGrowthRate - Monthly growth rate (e.g., 0.05 for 5%)
 * @param month - Month number (1 = first month, no growth applied)
 * @returns Projected gross revenue for the specified month
 *
 * @example
 * projectMonthGrossRevenue(5000, 0.05, 1)  // returns 5000
 * projectMonthGrossRevenue(5000, 0.05, 2)  // returns 5250
 * projectMonthGrossRevenue(5000, 0.05, 12) // returns ~8551.70
 */
export function projectMonthGrossRevenue(
  startingGross: number,
  monthlyGrowthRate: number,
  month: number
): number {
  // Month 1 has no growth applied (it's the starting point)
  // Month 2 = startingGross * (1 + rate)^1
  // Month n = startingGross * (1 + rate)^(n-1)
  return startingGross * Math.pow(1 + monthlyGrowthRate, month - 1);
}

/**
 * Calculate cumulative profit over multiple months with growth and fees
 *
 * @param startingGross - Starting monthly gross revenue (in EUR)
 * @param monthlyGrowthRate - Monthly growth rate (e.g., 0.05 for 5%)
 * @param monthlyFixedCosts - Monthly fixed costs (in EUR)
 * @param months - Number of months to project
 * @returns Total cumulative profit over the period
 *
 * @example
 * calculateCumulativeProfit(5000, 0.05, 2000, 3) // cumulative profit for 3 months
 */
export function calculateCumulativeProfit(
  startingGross: number,
  monthlyGrowthRate: number,
  monthlyFixedCosts: number,
  months: number
): number {
  let cumulativeProfit = 0;

  for (let month = 1; month <= months; month++) {
    const monthGross = projectMonthGrossRevenue(startingGross, monthlyGrowthRate, month);
    const monthProfit = calculateMonthlyProfit(monthGross, monthlyFixedCosts);
    cumulativeProfit += monthProfit;
  }

  return cumulativeProfit;
}

/**
 * Find the month when cumulative profit turns positive (break-even month)
 *
 * @param initialInvestment - Initial investment to recover (in EUR)
 * @param startingGross - Starting monthly gross revenue (in EUR)
 * @param monthlyGrowthRate - Monthly growth rate (e.g., 0.05 for 5%)
 * @param monthlyFixedCosts - Monthly fixed costs (in EUR)
 * @param maxMonths - Maximum months to search (default: 60)
 * @returns Month number when break-even is reached, or null if not within maxMonths
 *
 * @example
 * findBreakEvenMonth(10000, 5000, 0.05, 2000) // returns ~4
 */
export function findBreakEvenMonth(
  initialInvestment: number,
  startingGross: number,
  monthlyGrowthRate: number,
  monthlyFixedCosts: number,
  maxMonths: number = 60
): number | null {
  // Start with negative of initial investment
  let cumulativeBalance = -initialInvestment;

  for (let month = 1; month <= maxMonths; month++) {
    const monthGross = projectMonthGrossRevenue(startingGross, monthlyGrowthRate, month);
    const monthProfit = calculateMonthlyProfit(monthGross, monthlyFixedCosts);
    cumulativeBalance += monthProfit;

    if (cumulativeBalance >= 0) {
      return month;
    }
  }

  // Break-even not reached within maxMonths
  return null;
}
