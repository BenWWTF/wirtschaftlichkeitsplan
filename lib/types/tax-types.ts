/**
 * Comprehensive Austrian Tax Calculation Types
 *
 * Supports mixed income scenarios:
 * - Employment income (with social security)
 * - Self-employment income (with Gewinnfreibetrag)
 * - Multiple deductions and credits
 * - Progressive tax brackets
 */

// ========================================================================
// INPUT TYPES
// ========================================================================

/**
 * Employment income from salary/wages
 */
export interface EmploymentIncome {
  /** Annual gross salary from employer */
  grossSalary: number
  /** Special payments like 13th/14th month salary */
  specialPaymentsGross?: number
  /** Tax-free benefits (company car, meals, etc.) */
  taxFreeBenefits?: number
  /** Days worked from home (for homeoffice deduction) */
  homeOfficeDays?: number
  /** Employee social security already paid (from Lohnzettel) */
  employeeSsPaid?: number
  /** Wage tax already withheld (from Lohnzettel) */
  wageTaxWithheld?: number
}

/**
 * Self-employment income from business
 */
export interface SelfEmploymentIncome {
  /** Total annual business revenue */
  totalRevenue: number
  /** Total annual business expenses */
  businessExpenses: number
  /** Breakdown of expenses by category (optional detail) */
  expenseBreakdown?: Record<string, number>
  /** Practice type for medical professionals */
  practiceType?: 'kassenarzt' | 'wahlarzt' | 'mixed'
}

/**
 * Tax deductions (Sonderausgaben)
 */
export interface TaxDeductions {
  /** Charitable donations */
  charitableDonations?: number
  /** Private pension contributions */
  pensionContributions?: number
  /** Life insurance premiums */
  lifeInsurancePremiums?: number
  /** Church tax contributions */
  churchTax?: number
  /** Home loan interest (limited deduction) */
  homeLoanInterest?: number
}

/**
 * Tax credits (Absetzbeträge)
 */
export interface TaxCredits {
  /** Commuter credit (Verkehrsabsetzbetrag) */
  hasCommuterCredit?: boolean
  /** Commuter allowance (Pendlerpauschale) if applicable */
  commuterAllowance?: number
  /** Sole earner credit (Alleinverdienerabsetzbetrag) */
  soleEarnerCredit?: number
  /** Child support credit (Unterhaltsabsetzbetrag) */
  childSupportCredit?: number
  /** Number of children for credits */
  numberOfChildren?: number
}

/**
 * Complete tax calculation input
 */
export interface ComprehensiveTaxInput {
  employment?: EmploymentIncome
  selfEmployment?: SelfEmploymentIncome
  deductions?: TaxDeductions
  credits?: TaxCredits
  taxYear?: number
}

// ========================================================================
// CALCULATION BREAKDOWN TYPES
// ========================================================================

/**
 * Social security breakdown
 */
export interface SocialSecurityBreakdown {
  /** Pension insurance contribution */
  pension: number
  /** Health insurance contribution */
  health: number
  /** Unemployment insurance (employee only) */
  unemployment?: number
  /** Accident insurance */
  accident: number
  /** Special payments component */
  specialPayments?: number
  /** Assessment base used for calculation */
  assessmentBase?: number
}

/**
 * Complete social security details
 */
export interface SocialSecurityDetails {
  employee: SocialSecurityBreakdown
  selfEmployed: SocialSecurityBreakdown
}

/**
 * Tax breakdown by bracket
 */
export interface TaxBracketBreakdown {
  [bracket: string]: number // e.g. "€0 - €12,816 (0%)" => 0.00
}

/**
 * Expense breakdown details
 */
export interface ExpenseDetails {
  category: string
  amount: number
  percentage: number
}

// ========================================================================
// RESULT TYPES
// ========================================================================

/**
 * Complete comprehensive tax calculation result
 */
export interface ComprehensiveTaxResult {
  // ======== INCOME SECTION ========
  /** Total gross income from all sources */
  totalGrossIncome: number
  /** Employment gross income */
  employmentGross: number
  /** Self-employment profit (revenue - expenses) */
  selfEmploymentProfit: number

  // ======== SOCIAL SECURITY SECTION ========
  /** Employee social security contributions */
  employeeSs: number
  /** Self-employed social security (SVS) */
  selfEmployedSs: number
  /** Total social security burden */
  totalSs: number
  /** Detailed social security breakdown */
  ssBreakdown: SocialSecurityDetails

  // ======== TAXABLE INCOME SECTION ========
  /** Taxable employment income */
  taxableEmployment: number
  /** Taxable self-employment income */
  taxableSelfEmployment: number
  /** Total taxable income before tax deductions */
  totalTaxableIncome: number
  /** Gewinnfreibetrag (15% profit allowance) */
  gewinnfreibetrag: number
  /** Applied tax deductions */
  appliedDeductions: number
  /** Applied tax credits */
  appliedCredits: number
  /** Final taxable income after deductions */
  finalTaxableIncome: number

  // ======== INCOME TAX SECTION ========
  /** Income tax before credits */
  incomeTaxBeforeCredits: number
  /** Tax credits applied (Absetzbeträge) */
  taxCreditsApplied: number
  /** Tax on special payments (6% on excess €620) */
  specialPaymentsTax: number
  /** Total income tax liability */
  totalIncomeTax: number
  /** Tax breakdown by bracket for transparency */
  taxBreakdownByBracket: TaxBracketBreakdown

  // ======== OTHER TAXES ========
  /** VAT on private patients (medical practices) */
  vat?: number
  /** Medical chamber contributions (Ärztekammer) */
  aerztekammerBeitrag?: number

  // ======== FINAL CALCULATION ========
  /** Total tax that needs to be paid (after already paid taxes) */
  taxLiability: number
  /** Sum of all taxes and social security */
  totalDirectBurden: number
  /** Percentage of gross income that goes to taxes/SS */
  burdenPercentage: number
  /** Net income after all deductions */
  netIncome: number

  // ======== TAX RATES ========
  /** Effective tax rate (income tax as % of income) */
  effectiveTaxRate: number
  /** Marginal tax rate (rate on next euro earned) */
  marginalTaxRate: number

  // ======== METADATA ========
  /** Tax year this calculation is for */
  taxYear: number
  /** Timestamp of calculation */
  calculatedAt: Date
}

/**
 * Tax scenario for comparison and storage
 */
export interface TaxScenario {
  id: string
  userId: string
  scenarioName: string
  description?: string
  input: ComprehensiveTaxInput
  result: ComprehensiveTaxResult
  createdAt: Date
  updatedAt: Date
}

/**
 * Tax report metadata
 */
export interface TaxReport {
  id: string
  userId: string
  scenarioId?: string
  reportType: 'html' | 'pdf' | 'csv' | 'json'
  fileName: string
  generatedAt: Date
  data: string | Blob
}

/**
 * Comparison result between scenarios
 */
export interface ScenarioComparison {
  scenarios: TaxScenario[]
  comparison: {
    totalGrossIncome: ComparisonValue
    totalSs: ComparisonValue
    totalIncomeTax: ComparisonValue
    netIncome: ComparisonValue
    burdenPercentage: ComparisonValue
    bestScenarioId: string
    worstScenarioId: string
  }
}

/**
 * Single value in comparison
 */
export interface ComparisonValue {
  [scenarioId: string]: number
}

/**
 * Optimization suggestion
 */
export interface TaxOptimizationTip {
  type: 'warning' | 'success' | 'info' | 'tip'
  category: string
  title: string
  description: string
  potentialSavings?: number
  actionItems?: string[]
}

/**
 * Monthly tax tracking
 */
export interface MonthlyTaxProgress {
  month: number
  year: number
  ytdRevenue: number
  ytdExpenses: number
  ytdProfit: number
  ytdTaxBurden: number
  projectedAnnualBurden: number
  burdenPercentage: number
}

/**
 * Tax deadline
 */
export interface TaxDeadline {
  date: string
  description: string
  type: 'filing' | 'payment' | 'reminder'
  important: boolean
}

// ========================================================================
// CONFIGURATION TYPES
// ========================================================================

/**
 * Tax bracket configuration
 */
export interface TaxBracket {
  upperLimit: number
  rate: number
  description?: string
}

/**
 * Social security configuration
 */
export interface SocialSecurityConfig {
  employeeRateRegular: number
  employeeRateSpecial: number
  selfEmployedRate: number
  minAssessmentBase: number
  maxAssessmentBase: number
  componentRates: {
    pensionRate: number
    healthRate: number
    unemploymentRate: number
    accidentRate: number
  }
}

/**
 * Tax year configuration
 */
export interface TaxYearConfig {
  year: number
  taxBrackets: TaxBracket[]
  socialSecurity: SocialSecurityConfig
  taxCredits: {
    verkehrsabsetzbetrag: number
    alleinverdienerSingle: number
    alleinverdienerWith1Child: number
    alleinverdienerWithMoreChildren: number
  }
  deductionLimits: {
    lifeInsuranceMax: number
    pensionContributionMax: number
    gewinnfreibetragRate: number
    gewinnfreibetragLimit: number
    homeofficeDaily: number
    homeofficeMonthlyMax: number
  }
  specialPayments: {
    taxFreeLimit: number
    taxRate: number
  }
}

// ========================================================================
// EXPORT TYPES
// ========================================================================

/**
 * Supported export formats
 */
export type ExportFormat = 'html' | 'pdf' | 'csv' | 'json'

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat
  fileName?: string
  includeBreakdown?: boolean
  includeTips?: boolean
}

// ========================================================================
// UTILITY TYPES
// ========================================================================

/**
 * API response type
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

/**
 * Pagination result
 */
export interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
