/**
 * Comprehensive Austrian Tax Calculator
 *
 * Calculates Austrian income tax for mixed income scenarios:
 * - Employment income with social security
 * - Self-employment income with Gewinnfreibetrag
 * - Multiple deductions and credits
 * - Progressive tax brackets with detailed breakdown
 *
 * Based on Austrian tax law 2023-2025
 */

import {
  type ComprehensiveTaxInput,
  type ComprehensiveTaxResult,
  type EmploymentIncome,
  type SelfEmploymentIncome,
  type TaxDeductions,
  type TaxCredits,
  type SocialSecurityBreakdown,
  type SocialSecurityDetails,
  type TaxBracketBreakdown,
  type TaxOptimizationTip,
  type MonthlyTaxProgress,
} from '@/lib/types/tax-types'
import {
  getTaxConfig,
  getCurrentTaxConfig,
  formatEuro,
  formatPercentage,
} from '@/lib/config/tax-config'

// ========================================================================
// CONSTANTS
// ========================================================================

const DECIMAL_PLACES = 2
const ROUNDING_MODE = 'half-up'

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

/**
 * Round amount to 2 decimal places (cent precision)
 */
function roundAmount(amount: number): number {
  return Math.round(amount * 100) / 100
}

/**
 * Ensure amount is non-negative
 */
function ensureNonNegative(amount: number): number {
  return Math.max(0, roundAmount(amount))
}

/**
 * Get zero values for all income types
 */
function getZeroValues() {
  return {
    employmentGross: 0,
    selfEmploymentProfit: 0,
    employeeSs: 0,
    selfEmployedSs: 0,
  }
}

// ========================================================================
// SOCIAL SECURITY CALCULATIONS
// ========================================================================

/**
 * Calculate employee social security contributions
 */
function calculateEmployeeSs(
  salary: number,
  specialPayments: number,
  config: any
): { total: number; breakdown: SocialSecurityBreakdown } {
  const ssConfig = config.socialSecurity

  // Apply cap to regular salary
  const cappedSalary = Math.min(salary, ssConfig.maxAssessmentBase)
  const cappedSpecial = Math.min(
    specialPayments,
    ssConfig.maxAssessmentBase - cappedSalary
  )

  // Regular contributions
  const regularSs = roundAmount(cappedSalary * ssConfig.employeeRateRegular)
  const specialSs = roundAmount(cappedSpecial * ssConfig.employeeRateSpecial)
  const totalSs = regularSs + specialSs

  // Detailed breakdown
  const breakdown: SocialSecurityBreakdown = {
    pension: roundAmount(cappedSalary * ssConfig.componentRates.pensionRate),
    health: roundAmount(cappedSalary * ssConfig.componentRates.healthRate),
    unemployment: roundAmount(
      cappedSalary * ssConfig.componentRates.unemploymentRate
    ),
    accident: roundAmount(cappedSalary * ssConfig.componentRates.accidentRate),
    specialPayments: specialSs,
  }

  return {
    total: totalSs,
    breakdown,
  }
}

/**
 * Calculate self-employed social security (SVS)
 */
function calculateSelfEmployedSs(
  profit: number,
  config: any
): { total: number; breakdown: SocialSecurityBreakdown } {
  const ssConfig = config.socialSecurity

  // Apply assessment base cap
  const assessmentBase = Math.min(
    Math.max(profit, ssConfig.minAssessmentBase),
    ssConfig.maxAssessmentBase
  )

  // Calculate contributions
  const pension = roundAmount(
    assessmentBase * ssConfig.componentRates.pensionRate
  )
  const health = roundAmount(
    assessmentBase * ssConfig.componentRates.healthRate
  )
  const accident = roundAmount(
    assessmentBase * ssConfig.componentRates.accidentRate
  )
  const totalSs = pension + health + accident

  const breakdown: SocialSecurityBreakdown = {
    pension,
    health,
    accident,
    assessmentBase,
  }

  return {
    total: totalSs,
    breakdown,
  }
}

// ========================================================================
// TAX CALCULATIONS
// ========================================================================

/**
 * Calculate Gewinnfreibetrag (15% profit allowance)
 */
function calculateGewinnfreibetrag(profit: number, config: any): number {
  const limits = config.deductionLimits
  const applicableProfit = Math.min(profit, limits.gewinnfreibetragLimit)
  return roundAmount(applicableProfit * limits.gewinnfreibetragRate)
}

/**
 * Calculate progressive income tax
 */
function calculateProgressiveTax(
  taxableIncome: number,
  config: any
): { total: number; breakdown: TaxBracketBreakdown } {
  const brackets = config.taxBrackets
  const breakdown: TaxBracketBreakdown = {}

  let tax = 0
  let previousLimit = 0

  for (const bracket of brackets) {
    if (taxableIncome <= previousLimit) {
      break
    }

    const upper = Math.min(taxableIncome, bracket.upperLimit)
    const taxableInBracket = upper - previousLimit

    if (taxableInBracket > 0) {
      const taxInBracket = roundAmount(taxableInBracket * bracket.rate)
      tax += taxInBracket

      // Create breakdown entry
      const percentage = roundAmount(bracket.rate * 100)
      const bracketKey = `€${previousLimit.toLocaleString('de-AT', {
        maximumFractionDigits: 0,
      })} - €${upper.toLocaleString('de-AT', {
        maximumFractionDigits: 0,
      })} (${percentage}%)`
      breakdown[bracketKey] = taxInBracket
    }

    previousLimit = bracket.upperLimit
  }

  return {
    total: roundAmount(tax),
    breakdown,
  }
}

/**
 * Calculate tax on special payments (13th, 14th salary)
 */
function calculateSpecialPaymentsTax(
  specialPaymentsNet: number,
  config: any
): number {
  const { taxFreeLimit, taxRate } = config.specialPayments

  if (specialPaymentsNet <= taxFreeLimit) {
    return 0
  }

  const taxable = specialPaymentsNet - taxFreeLimit
  return roundAmount(taxable * taxRate)
}

/**
 * Calculate tax credits
 */
function calculateTaxCredits(
  credits: TaxCredits | undefined,
  config: any
): number {
  if (!credits) {
    return 0
  }

  let total = 0

  if (credits.hasCommuterCredit) {
    total += config.taxCredits.verkehrsabsetzbetrag
  }

  if (credits.commuterAllowance) {
    total += credits.commuterAllowance
  }

  if (credits.soleEarnerCredit) {
    total += credits.soleEarnerCredit
  }

  if (credits.childSupportCredit) {
    total += credits.childSupportCredit
  }

  return roundAmount(total)
}

/**
 * Calculate homeoffice deduction
 */
function calculateHomeofficeDeduction(
  days: number | undefined,
  config: any
): number {
  if (!days || days <= 0) {
    return 0
  }

  const limits = config.deductionLimits
  const dailyTotal = roundAmount(days * limits.homeofficeDaily)

  // Cap at monthly max (approximate for year)
  const months = Math.min(12, Math.ceil(days / 20))
  const capped = Math.min(
    dailyTotal,
    roundAmount(limits.homeofficeMonthlyMax * months)
  )

  return roundAmount(capped)
}

/**
 * Calculate total deductions
 */
function calculateTotalDeductions(
  deductions: TaxDeductions | undefined,
  homeofficeDeduction: number
): number {
  if (!deductions) {
    return homeofficeDeduction
  }

  let total = homeofficeDeduction

  if (deductions.charitableDonations) {
    total += deductions.charitableDonations
  }

  if (deductions.pensionContributions) {
    total += deductions.pensionContributions
  }

  if (deductions.lifeInsurancePremiums) {
    total += deductions.lifeInsurancePremiums
  }

  if (deductions.churchTax) {
    total += deductions.churchTax
  }

  if (deductions.homeLoanInterest) {
    total += deductions.homeLoanInterest
  }

  return roundAmount(total)
}

/**
 * Get marginal tax rate for given income
 */
function getMarginalTaxRate(taxableIncome: number, config: any): number {
  const brackets = config.taxBrackets

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.upperLimit) {
      return roundAmount(bracket.rate * 100)
    }
  }

  return roundAmount(brackets[brackets.length - 1].rate * 100)
}

// ========================================================================
// MEDICAL PRACTICE SPECIFIC
// ========================================================================

/**
 * Calculate Ärztekammer (Medical Chamber) contributions
 */
function calculateAerztekammerBeitrag(profit: number): number {
  const BASE_FEE = 300
  const INCOME_PERCENTAGE = 0.03
  return roundAmount(BASE_FEE + profit * INCOME_PERCENTAGE)
}

/**
 * Calculate VAT on private patients
 */
function calculateVAT(privatePatientRevenue: number): number {
  const VAT_RATE = 0.2
  // VAT = Revenue * (20/120)
  return roundAmount(privatePatientRevenue * (VAT_RATE / (1 + VAT_RATE)))
}

// ========================================================================
// MAIN CALCULATOR
// ========================================================================

/**
 * Calculate comprehensive Austrian tax
 */
export function calculateComprehensiveTax(
  input: ComprehensiveTaxInput
): ComprehensiveTaxResult {
  const taxYear = input.taxYear || new Date().getFullYear()
  const config = getTaxConfig(taxYear)

  // ======== EMPLOYMENT INCOME ========
  let employmentGross = 0
  let specialPaymentsGross = 0
  let employeeSsTotal = 0
  let employeeSsBreakdown: SocialSecurityBreakdown = {
    pension: 0,
    health: 0,
    unemployment: 0,
    accident: 0,
  }
  let wageTaxWithheld = 0
  let taxableEmployment = 0
  let specialPaymentsNet = 0

  if (input.employment) {
    const emp = input.employment

    employmentGross = roundAmount(emp.grossSalary || 0)
    specialPaymentsGross = roundAmount(emp.specialPaymentsGross || 0)
    wageTaxWithheld = roundAmount(emp.wageTaxWithheld || 0)

    // Calculate employee social security
    if (emp.employeeSsPaid) {
      employeeSsTotal = roundAmount(emp.employeeSsPaid)
      // Estimate breakdown if not provided
      employeeSsBreakdown = {
        pension: roundAmount(employmentGross * 0.1025),
        health: roundAmount(employmentGross * 0.0387),
        unemployment: roundAmount(employmentGross * 0.03),
        accident: roundAmount(employmentGross * 0.01),
      }
    } else {
      const ssResult = calculateEmployeeSs(
        employmentGross,
        specialPaymentsGross,
        config
      )
      employeeSsTotal = ssResult.total
      employeeSsBreakdown = ssResult.breakdown
    }

    // Calculate homeoffice deduction
    const homeofficeDeduction = calculateHomeofficeDeduction(
      emp.homeOfficeDays,
      config
    )

    // Taxable employment (after SS and standard deduction)
    const standardWerbungskosten = 132
    taxableEmployment = ensureNonNegative(
      employmentGross -
        (employeeSsTotal - (employeeSsBreakdown.specialPayments || 0)) -
        homeofficeDeduction -
        standardWerbungskosten
    )

    // Special payments net (after SS)
    specialPaymentsNet = ensureNonNegative(
      specialPaymentsGross - (employeeSsBreakdown.specialPayments || 0)
    )
  }

  // ======== SELF-EMPLOYMENT INCOME ========
  let selfEmploymentProfit = 0
  let selfEmployedSsTotal = 0
  let selfEmployedSsBreakdown: SocialSecurityBreakdown = {
    pension: 0,
    health: 0,
    accident: 0,
  }
  let gewinnfreibetrag = 0
  let taxableSelfEmployment = 0

  if (input.selfEmployment) {
    const selfEmp = input.selfEmployment
    const revenue = roundAmount(selfEmp.totalRevenue || 0)
    const expenses = roundAmount(selfEmp.businessExpenses || 0)

    selfEmploymentProfit = ensureNonNegative(revenue - expenses)

    // Calculate self-employed social security
    const ssResult = calculateSelfEmployedSs(selfEmploymentProfit, config)
    selfEmployedSsTotal = ssResult.total
    selfEmployedSsBreakdown = ssResult.breakdown

    // Calculate Gewinnfreibetrag
    gewinnfreibetrag = calculateGewinnfreibetrag(selfEmploymentProfit, config)

    // Taxable self-employment
    taxableSelfEmployment = ensureNonNegative(
      selfEmploymentProfit - gewinnfreibetrag
    )
  }

  // ======== COMBINED INCOME ========
  const totalGrossIncome = employmentGross + selfEmploymentProfit
  const totalSs = employeeSsTotal + selfEmployedSsTotal

  // ======== DEDUCTIONS & CREDITS ========
  const homeofficeDeduction = calculateHomeofficeDeduction(
    input.employment?.homeOfficeDays,
    config
  )
  const totalDeductions = calculateTotalDeductions(
    input.deductions,
    homeofficeDeduction
  )
  const taxCreditsAmount = calculateTaxCredits(input.credits, config)

  // ======== TAXABLE INCOME ========
  const totalTaxableBeforeDeductions =
    taxableEmployment + taxableSelfEmployment
  const finalTaxableIncome = ensureNonNegative(
    totalTaxableBeforeDeductions - totalDeductions
  )

  // ======== INCOME TAX ========
  const { total: incomeTaxBeforeCredits, breakdown: taxBreakdown } =
    calculateProgressiveTax(finalTaxableIncome, config)
  const incomeTaxAfterCredits = ensureNonNegative(
    incomeTaxBeforeCredits - taxCreditsAmount
  )
  const specialPaymentsTax = calculateSpecialPaymentsTax(
    specialPaymentsNet,
    config
  )
  const totalIncomeTax = incomeTaxAfterCredits + specialPaymentsTax

  // ======== OPTIONAL: MEDICAL PRACTICE SPECIFIC ========
  let aerztekammerBeitrag = 0
  let vat = 0

  if (input.selfEmployment?.practiceType && input.selfEmployment.practiceType !== 'kassenarzt') {
    aerztekammerBeitrag = calculateAerztekammerBeitrag(selfEmploymentProfit)
    vat = calculateVAT(input.selfEmployment.totalRevenue || 0)
  }

  // ======== FINAL CALCULATION ========
  const totalDirectBurden = totalSs + totalIncomeTax + aerztekammerBeitrag + vat
  const netIncome = totalGrossIncome - totalDirectBurden
  const burdenPercentage =
    totalGrossIncome > 0
      ? roundAmount((totalDirectBurden / totalGrossIncome) * 100)
      : 0
  const effectiveTaxRate =
    totalGrossIncome > 0
      ? roundAmount((totalIncomeTax / totalGrossIncome) * 100)
      : 0
  const marginalTaxRate = getMarginalTaxRate(finalTaxableIncome, config)

  const taxLiability = roundAmount(totalIncomeTax - wageTaxWithheld)

  return {
    // Income
    totalGrossIncome: roundAmount(totalGrossIncome),
    employmentGross: roundAmount(employmentGross),
    selfEmploymentProfit: roundAmount(selfEmploymentProfit),

    // Social Security
    employeeSs: roundAmount(employeeSsTotal),
    selfEmployedSs: roundAmount(selfEmployedSsTotal),
    totalSs: roundAmount(totalSs),
    ssBreakdown: {
      employee: employeeSsBreakdown,
      selfEmployed: selfEmployedSsBreakdown,
    },

    // Taxable Income
    taxableEmployment: roundAmount(taxableEmployment),
    taxableSelfEmployment: roundAmount(taxableSelfEmployment),
    totalTaxableIncome: roundAmount(finalTaxableIncome),
    gewinnfreibetrag: roundAmount(gewinnfreibetrag),
    appliedDeductions: roundAmount(totalDeductions),
    appliedCredits: roundAmount(taxCreditsAmount),
    finalTaxableIncome: roundAmount(finalTaxableIncome),

    // Income Tax
    incomeTaxBeforeCredits: roundAmount(incomeTaxBeforeCredits),
    taxCreditsApplied: roundAmount(taxCreditsAmount),
    specialPaymentsTax: roundAmount(specialPaymentsTax),
    totalIncomeTax: roundAmount(totalIncomeTax),
    taxBreakdownByBracket: taxBreakdown,

    // Other Taxes
    vat: roundAmount(vat),
    aerztekammerBeitrag: roundAmount(aerztekammerBeitrag),

    // Final
    taxLiability: roundAmount(taxLiability),
    totalDirectBurden: roundAmount(totalDirectBurden),
    burdenPercentage: roundAmount(burdenPercentage),
    netIncome: roundAmount(netIncome),
    effectiveTaxRate: roundAmount(effectiveTaxRate),
    marginalTaxRate: roundAmount(marginalTaxRate),

    // Metadata
    taxYear,
    calculatedAt: new Date(),
  }
}

/**
 * Quick estimation without detailed inputs
 */
export function quickTaxEstimate(
  employmentGross: number = 0,
  selfEmploymentProfit: number = 0,
  taxYear?: number
): Omit<ComprehensiveTaxResult, 'calculatedAt'> & { calculatedAt: Date } {
  const input: ComprehensiveTaxInput = {
    employment: employmentGross > 0 ? { grossSalary: employmentGross } : undefined,
    selfEmployment:
      selfEmploymentProfit > 0
        ? { totalRevenue: selfEmploymentProfit, businessExpenses: 0 }
        : undefined,
    taxYear,
  }

  return calculateComprehensiveTax(input)
}

/**
 * Calculate quarterly advance tax payment (Vorauszahlung)
 */
export function calculateQuarterlyPayments(
  annualIncomeTax: number
): Record<string, number> {
  const quarterly = roundAmount(annualIncomeTax / 4)

  return {
    q1: quarterly,
    q2: quarterly,
    q3: quarterly,
    q4: quarterly,
    total: roundAmount(quarterly * 4),
  }
}

/**
 * Generate tax optimization tips
 */
export function generateTaxOptimizationTips(
  result: ComprehensiveTaxResult
): TaxOptimizationTip[] {
  const tips: TaxOptimizationTip[] = []

  // High tax burden
  if (result.effectiveTaxRate > 45) {
    tips.push({
      type: 'warning',
      category: 'High Tax Burden',
      title: 'Consider Additional Deductions',
      description: `Your effective tax rate is ${result.effectiveTaxRate.toFixed(1)}%. Consider making additional business expenses or pension contributions before year-end.`,
      potentialSavings: roundAmount(
        (result.totalDirectBurden * result.effectiveTaxRate) / 100
      ),
    })
  }

  // Gewinnfreibetrag potential
  if (
    result.selfEmploymentProfit > 0 &&
    result.selfEmploymentProfit < 33000 &&
    result.gewinnfreibetrag > 0
  ) {
    tips.push({
      type: 'success',
      category: 'Tax Benefits',
      title: 'Gewinnfreibetrag Applied',
      description: `You're using the 15% profit allowance (Gewinnfreibetrag) which saves you approximately ${formatEuro(roundAmount(result.gewinnfreibetrag * 0.41))} in taxes.`,
    })
  }

  // Profitable practice
  if (result.netIncome > 60000) {
    tips.push({
      type: 'success',
      category: 'Performance',
      title: 'Strong Financial Health',
      description:
        'Congratulations! Your net income exceeds €60,000, which is above the Austrian average for your profession.',
    })
  }

  // Low profit warning
  if (result.selfEmploymentProfit > 0 && result.selfEmploymentProfit < 10000) {
    tips.push({
      type: 'warning',
      category: 'Business Health',
      title: 'Low Profit',
      description:
        'Your profit is below €10,000. Review your pricing strategy and cost structure.',
    })
  }

  // Marginal rate notification
  if (result.marginalTaxRate >= 48) {
    tips.push({
      type: 'info',
      category: 'Tax Planning',
      title: 'High Marginal Rate',
      description: `Each additional euro you earn is taxed at ${result.marginalTaxRate.toFixed(0)}%. Consider income shifting strategies.`,
    })
  }

  // Pension contribution opportunity
  if (result.totalGrossIncome > 50000) {
    tips.push({
      type: 'tip',
      category: 'Deductions',
      title: 'Pension Contributions',
      description: `You can contribute up to €3,100 annually to a private pension, saving approximately €1,271 in taxes.`,
      potentialSavings: 1271,
    })
  }

  return tips
}

/**
 * Calculate monthly tax progress
 */
export function calculateMonthlyProgress(
  ytdRevenue: number,
  ytdExpenses: number,
  ytdEmploymentIncome: number = 0,
  month: number = 6
): MonthlyTaxProgress {
  const result = calculateComprehensiveTax({
    employment: ytdEmploymentIncome > 0 ? { grossSalary: ytdEmploymentIncome } : undefined,
    selfEmployment: {
      totalRevenue: ytdRevenue,
      businessExpenses: ytdExpenses,
    },
  })

  const projectedAnnual = roundAmount((result.totalDirectBurden / month) * 12)

  return {
    month,
    year: new Date().getFullYear(),
    ytdRevenue,
    ytdExpenses,
    ytdProfit: ytdRevenue - ytdExpenses,
    ytdTaxBurden: result.totalDirectBurden,
    projectedAnnualBurden: projectedAnnual,
    burdenPercentage: result.burdenPercentage,
  }
}

/**
 * Export result as plain object for JSON serialization
 */
export function resultToJSON(result: ComprehensiveTaxResult): Record<string, any> {
  return {
    income: {
      totalGross: result.totalGrossIncome,
      employment: result.employmentGross,
      selfEmployment: result.selfEmploymentProfit,
    },
    socialSecurity: {
      employee: result.employeeSs,
      selfEmployed: result.selfEmployedSs,
      total: result.totalSs,
    },
    tax: {
      incomeTaxBeforeCredits: result.incomeTaxBeforeCredits,
      creditsApplied: result.taxCreditsApplied,
      specialPayments: result.specialPaymentsTax,
      total: result.totalIncomeTax,
    },
    burden: {
      total: result.totalDirectBurden,
      percentage: result.burdenPercentage,
      effectiveTaxRate: result.effectiveTaxRate,
      marginalTaxRate: result.marginalTaxRate,
    },
    netIncome: result.netIncome,
    taxYear: result.taxYear,
  }
}
