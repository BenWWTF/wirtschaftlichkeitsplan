/**
 * Payment fee calculations for therapy pricing
 * Deducts payment processing fees (e.g., SumUp 1.39%) from session prices
 */

/**
 * Calculate net session price after payment processing fee deduction
 * @param grossPrice - Gross price before fee deduction
 * @param feePercentage - Fee percentage (e.g., 1.39 for 1.39%)
 * @returns Net price after fee deduction
 * @example
 * calculateNetPrice(100, 1.39) = 98.61
 */
export function calculateNetPrice(grossPrice: number, feePercentage: number): number {
  if (grossPrice <= 0 || feePercentage < 0 || feePercentage > 100) {
    return grossPrice
  }
  const feeDecimal = feePercentage / 100
  return grossPrice * (1 - feeDecimal)
}

/**
 * Calculate net revenue after payment processing fees
 * @param grossRevenue - Total revenue before fees
 * @param feePercentage - Fee percentage
 * @returns Net revenue after fee deduction
 */
export function calculateNetRevenue(grossRevenue: number, feePercentage: number): number {
  return calculateNetPrice(grossRevenue, feePercentage)
}

/**
 * Calculate the fee amount deducted
 * @param grossAmount - Gross amount before fees
 * @param feePercentage - Fee percentage
 * @returns Fee amount that was deducted
 */
export function calculateFeeAmount(grossAmount: number, feePercentage: number): number {
  return grossAmount - calculateNetPrice(grossAmount, feePercentage)
}

/**
 * Calculate net contribution margin after payment fees
 * @param pricePerSession - Gross session price
 * @param variableCostPerSession - Variable cost per session
 * @param feePercentage - Payment processing fee percentage
 * @returns Net contribution margin per session
 */
export function calculateNetContributionMargin(
  pricePerSession: number,
  variableCostPerSession: number,
  feePercentage: number
): number {
  const netPrice = calculateNetPrice(pricePerSession, feePercentage)
  return netPrice - variableCostPerSession
}

/**
 * Calculate break-even sessions needed with payment fees
 * @param fixedCosts - Monthly fixed costs
 * @param pricePerSession - Gross session price
 * @param variableCostPerSession - Variable cost per session
 * @param feePercentage - Payment processing fee percentage
 * @returns Sessions needed to break even (net of fees)
 */
export function calculateBreakEvenSessionsWithFees(
  fixedCosts: number,
  pricePerSession: number,
  variableCostPerSession: number,
  feePercentage: number
): number {
  const netContributionMargin = calculateNetContributionMargin(
    pricePerSession,
    variableCostPerSession,
    feePercentage
  )

  if (netContributionMargin <= 0) {
    return Infinity
  }

  return fixedCosts / netContributionMargin
}

/**
 * Calculate profit with payment fees deducted
 * @param sessions - Number of sessions
 * @param pricePerSession - Gross session price
 * @param variableCostPerSession - Variable cost per session
 * @param fixedCosts - Fixed costs
 * @param feePercentage - Payment processing fee percentage
 * @returns Net profit after all costs and fees
 */
export function calculateProfitWithFees(
  sessions: number,
  pricePerSession: number,
  variableCostPerSession: number,
  fixedCosts: number,
  feePercentage: number
): number {
  const netPrice = calculateNetPrice(pricePerSession, feePercentage)
  const totalNetRevenue = sessions * netPrice
  const totalVariableCosts = sessions * variableCostPerSession
  return totalNetRevenue - totalVariableCosts - fixedCosts
}

/**
 * Calculate profit margin percentage with fees
 * @param sessions - Number of sessions
 * @param pricePerSession - Gross session price
 * @param variableCostPerSession - Variable cost per session
 * @param fixedCosts - Fixed costs
 * @param feePercentage - Payment processing fee percentage
 * @returns Profit margin as percentage (0-100)
 */
export function calculateProfitMarginWithFees(
  sessions: number,
  pricePerSession: number,
  variableCostPerSession: number,
  fixedCosts: number,
  feePercentage: number
): number {
  const netPrice = calculateNetPrice(pricePerSession, feePercentage)
  const totalNetRevenue = sessions * netPrice

  if (totalNetRevenue === 0) {
    return 0
  }

  const profit = calculateProfitWithFees(
    sessions,
    pricePerSession,
    variableCostPerSession,
    fixedCosts,
    feePercentage
  )

  return (profit / totalNetRevenue) * 100
}

/**
 * Apply payment fee adjustment to price per session
 * Returns both gross and net prices for display/calculation
 */
export interface PriceBreakdown {
  grossPrice: number
  feePercentage: number
  feeAmount: number
  netPrice: number
}

export function getPriceBreakdown(
  grossPrice: number,
  feePercentage: number
): PriceBreakdown {
  const feeAmount = calculateFeeAmount(grossPrice, feePercentage)
  const netPrice = calculateNetPrice(grossPrice, feePercentage)

  return {
    grossPrice,
    feePercentage,
    feeAmount,
    netPrice,
  }
}

/**
 * Calculate SumUp costs as a separate cost line item
 * Shows the actual cost amount that should appear in Fixkosten
 * @param grossRevenue - Total gross revenue from sessions
 * @param feePercentage - SumUp fee percentage (typically 1.39)
 * @returns SumUp cost amount for the period
 */
export function calculateSumUpCosts(
  grossRevenue: number,
  feePercentage: number
): number {
  return calculateFeeAmount(grossRevenue, feePercentage)
}

/**
 * Calculate total costs including SumUp fees
 * @param fixedCosts - Fixed costs (existing expenses)
 * @param grossRevenue - Gross revenue from sessions
 * @param feePercentage - SumUp fee percentage
 * @returns Total costs = Fixed Costs + SumUp Costs
 */
export function calculateTotalCostsWithSumUp(
  fixedCosts: number,
  grossRevenue: number,
  feePercentage: number
): number {
  const sumUpCosts = calculateSumUpCosts(grossRevenue, feePercentage)
  return fixedCosts + sumUpCosts
}

/**
 * Calculate profit showing SumUp as separate cost line
 * Formula: Gross Revenue - Fixed Costs - SumUp Costs = Profit
 * @param grossRevenue - Gross revenue from all sessions
 * @param fixedCosts - Fixed operating costs
 * @param grossRevenue - Gross revenue for SumUp fee calculation
 * @param feePercentage - SumUp fee percentage
 * @returns Net profit after all costs
 */
export function calculateProfitWithSumUpCosts(
  grossRevenue: number,
  fixedCosts: number,
  feePercentage: number
): number {
  const totalCosts = calculateTotalCostsWithSumUp(fixedCosts, grossRevenue, feePercentage)
  return grossRevenue - totalCosts
}

/**
 * Calculate cost breakdown for transparency
 * Shows how much goes to fixed costs vs SumUp fees
 */
export interface CostBreakdown {
  grossRevenue: number
  fixedCosts: number
  sumUpCosts: number
  totalCosts: number
  netProfit: number
  feePercentage: number
}

export function getCostBreakdown(
  grossRevenue: number,
  fixedCosts: number,
  feePercentage: number
): CostBreakdown {
  const sumUpCosts = calculateSumUpCosts(grossRevenue, feePercentage)
  const totalCosts = fixedCosts + sumUpCosts
  const netProfit = grossRevenue - totalCosts

  return {
    grossRevenue,
    fixedCosts,
    sumUpCosts,
    totalCosts,
    netProfit,
    feePercentage,
  }
}
