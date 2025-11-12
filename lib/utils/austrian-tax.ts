/**
 * Austrian Tax Calculations for Medical Practices (2025)
 *
 * Includes:
 * - Income Tax (Einkommensteuer) with progressive brackets
 * - Social Insurance (Sozialversicherung - SVS)
 * - Austrian Medical Chamber (Ärztekammer) contributions
 * - VAT (Umsatzsteuer) calculations
 * - E/A-Rechnung (Einnahmen-Ausgaben-Rechnung) deductions
 */

export interface TaxCalculationInput {
  grossRevenue: number
  totalExpenses: number
  practiceType: 'kassenarzt' | 'wahlarzt' | 'mixed'
  applyingPauschalierung: boolean // 13% pauschale Betriebsausgaben
  privatePatientRevenue?: number // For VAT calculation
}

export interface TaxCalculationResult {
  grossRevenue: number
  totalExpenses: number
  profit: number // Gewinn before tax

  // Deductions
  pauschalDeduction: number // 13% if applicable
  svBeitraege: number // Sozialversicherung
  aerztekammerBeitrag: number // ~3% of income

  // Tax
  taxableIncome: number
  incomeTax: number
  vat: number // USt on private patients

  // Final
  totalTaxBurden: number
  netIncome: number // What you actually take home
  effectiveTaxRate: number // %
}

/**
 * Austrian Income Tax Brackets 2025
 * Source: Bundesministerium für Finanzen
 */
const INCOME_TAX_BRACKETS_2025 = [
  { limit: 12816, rate: 0 },      // Tax-free amount (Grundfreibetrag)
  { limit: 20818, rate: 0.20 },   // 20%
  { limit: 34513, rate: 0.30 },   // 30%
  { limit: 66612, rate: 0.41 },   // 41%
  { limit: 99266, rate: 0.48 },   // 48%
  { limit: Infinity, rate: 0.50 } // 50% (Reichensteuer)
]

/**
 * Calculate Austrian progressive income tax
 */
export function calculateIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= INCOME_TAX_BRACKETS_2025[0].limit) {
    return 0
  }

  let tax = 0
  let previousLimit = 0

  for (const bracket of INCOME_TAX_BRACKETS_2025) {
    if (taxableIncome <= bracket.limit) {
      // Income falls in this bracket
      tax += (taxableIncome - previousLimit) * bracket.rate
      break
    } else {
      // Income exceeds this bracket, tax the full bracket
      tax += (bracket.limit - previousLimit) * bracket.rate
      previousLimit = bracket.limit
    }
  }

  return Math.max(0, tax)
}

/**
 * Calculate Sozialversicherung (SVS) contributions for self-employed doctors
 *
 * SVS rates (2025 estimates):
 * - Krankenversicherung: ~7.65%
 * - Pensionsversicherung: ~18.50%
 * - Unfallversicherung: ~1.30%
 * Total: ~27.45% but capped at certain income levels
 *
 * Minimum monthly contribution: ~€500
 * Maximum assessment base: ~€90,000/year
 */
export function calculateSVBeitraege(profit: number): number {
  const MINIMUM_ANNUAL_SV = 500 * 12 // €6,000/year minimum
  const MAX_ASSESSMENT_BASE = 90000
  const SV_RATE = 0.2745 // ~27.45%

  // SVS uses profit (Gewinn) as assessment base
  const assessmentBase = Math.min(profit, MAX_ASSESSMENT_BASE)

  // Calculate actual contribution
  const calculatedSV = assessmentBase * SV_RATE

  // Apply minimum
  return Math.max(calculatedSV, MINIMUM_ANNUAL_SV)
}

/**
 * Calculate Ärztekammer (Austrian Medical Chamber) contributions
 *
 * Typical structure:
 * - Base fee: ~€200-400/year (varies by Bundesland)
 * - Income-based: ~2-3% of professional income
 * - Fortbildung (continuing education): included
 *
 * We'll use a simplified 3% model + base fee
 */
export function calculateAerztekammerBeitrag(profit: number): number {
  const BASE_FEE_ANNUAL = 300 // Average base fee
  const INCOME_PERCENTAGE = 0.03 // 3% of income

  return BASE_FEE_ANNUAL + (profit * INCOME_PERCENTAGE)
}

/**
 * Calculate VAT (Umsatzsteuer) on private patients
 *
 * Austrian medical services:
 * - Kassenleistungen: VAT-exempt (§6 Abs. 1 Z 19 UStG)
 * - Wahlärzte/Private: Subject to 20% VAT
 *
 * Note: Many Wahlärzte opt for Kleinunternehmerregelung (small business exemption)
 * if revenue < €35,000/year
 */
export function calculateVAT(privatePatientRevenue: number, isKleinunternehmer: boolean = false): number {
  if (isKleinunternehmer) {
    return 0
  }

  const VAT_RATE = 0.20 // 20%

  // VAT is calculated on revenue, not profit
  // Assumption: VAT is included in the price (Bruttopreis)
  // So we extract it: VAT = Revenue * (20/120)
  return privatePatientRevenue * (VAT_RATE / (1 + VAT_RATE))
}

/**
 * Calculate Pauschalierung (flat-rate expense deduction)
 *
 * E/A-Rechnung allows 13% pauschale Betriebsausgaben if:
 * - Annual revenue < €220,000
 * - Not required to keep full books (Bilanzierung)
 *
 * This is IN ADDITION to actual expenses
 */
export function calculatePauschalDeduction(profit: number, applying: boolean): number {
  if (!applying) {
    return 0
  }

  const PAUSCHAL_RATE = 0.13 // 13%

  // Applied to profit (Gewinn), not revenue
  return profit * PAUSCHAL_RATE
}

/**
 * Complete Austrian tax calculation for medical practices
 */
export function calculateAustrianTax(input: TaxCalculationInput): TaxCalculationResult {
  const {
    grossRevenue,
    totalExpenses,
    practiceType,
    applyingPauschalierung,
    privatePatientRevenue = grossRevenue // Default: assume all private if not specified
  } = input

  // Step 1: Calculate profit
  const profit = grossRevenue - totalExpenses

  // Step 2: Calculate deductions
  const pauschalDeduction = calculatePauschalDeduction(profit, applyingPauschalierung)
  const svBeitraege = calculateSVBeitraege(profit)
  const aerztekammerBeitrag = calculateAerztekammerBeitrag(profit)

  // Step 3: Calculate taxable income
  // Taxable income = Profit - Pauschale - SV - Ärztekammer
  const taxableIncome = Math.max(0, profit - pauschalDeduction - svBeitraege - aerztekammerBeitrag)

  // Step 4: Calculate income tax
  const incomeTax = calculateIncomeTax(taxableIncome)

  // Step 5: Calculate VAT (only on private patients)
  // Kassenärzte typically don't charge VAT
  const effectivePrivateRevenue = practiceType === 'kassenarzt' ? 0 : privatePatientRevenue
  const vat = calculateVAT(effectivePrivateRevenue)

  // Step 6: Calculate totals
  const totalTaxBurden = svBeitraege + aerztekammerBeitrag + incomeTax + vat
  const netIncome = profit - totalTaxBurden
  const effectiveTaxRate = profit > 0 ? (totalTaxBurden / profit) * 100 : 0

  return {
    grossRevenue,
    totalExpenses,
    profit,

    pauschalDeduction,
    svBeitraege,
    aerztekammerBeitrag,

    taxableIncome,
    incomeTax,
    vat,

    totalTaxBurden,
    netIncome,
    effectiveTaxRate
  }
}

/**
 * Calculate quarterly advance tax payments (Vorauszahlungen)
 *
 * The Austrian tax office requires quarterly advance payments based on
 * previous year's tax burden
 */
export function calculateQuarterlyVorauszahlungen(annualIncomeTax: number): {
  q1: number
  q2: number
  q3: number
  q4: number
  total: number
} {
  // Typically split into 4 equal quarterly payments
  const quarterlyAmount = annualIncomeTax / 4

  return {
    q1: quarterlyAmount,
    q2: quarterlyAmount,
    q3: quarterlyAmount,
    q4: quarterlyAmount,
    total: annualIncomeTax
  }
}

/**
 * Tax optimization suggestions based on current situation
 */
export function getTaxOptimizationTips(result: TaxCalculationResult): string[] {
  const tips: string[] = []

  // High tax burden
  if (result.effectiveTaxRate > 45) {
    tips.push('💡 Ihr effektiver Steuersatz ist über 45%. Erwägen Sie zusätzliche Betriebsausgaben (z.B. Fortbildungen, Geräte) noch in diesem Jahr zu tätigen.')
  }

  // Pauschale eligible
  if (!result.pauschalDeduction && result.grossRevenue < 220000) {
    tips.push('💡 Sie könnten von der 13% Pauschalierung profitieren (E/A-Rechnung). Dies würde Ihr steuerpflichtiges Einkommen um €' + (result.profit * 0.13).toLocaleString('de-AT', { maximumFractionDigits: 0 }) + ' reduzieren.')
  }

  // High SV contributions
  if (result.svBeitraege > result.profit * 0.30) {
    tips.push('ℹ️ Ihre SV-Beiträge sind hoch. Prüfen Sie, ob Sie die Beitragsgrundlage anpassen können.')
  }

  // Profitable practice
  if (result.netIncome > 60000) {
    tips.push('✅ Glückwunsch! Ihr Nettoeinkommen liegt deutlich über dem österreichischen Durchschnitt für Ärzte.')
  }

  // Loss or low profit
  if (result.profit < 10000) {
    tips.push('⚠️ Ihr Gewinn ist niedrig. Überprüfen Sie Ihre Preisgestaltung und Kostenstruktur.')
  }

  // VAT threshold
  if (result.vat === 0 && result.grossRevenue > 35000) {
    tips.push('ℹ️ Sie überschreiten die Kleinunternehmergrenze (€35.000). Möglicherweise sind Sie USt-pflichtig.')
  }

  return tips
}

/**
 * Format currency in Austrian style
 */
export function formatEuroAT(amount: number): string {
  return new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Get tax deadline reminders for Austrian medical practices
 */
export function getTaxDeadlines(year: number = new Date().getFullYear()): Array<{
  date: string
  description: string
  type: 'filing' | 'payment' | 'reminder'
}> {
  return [
    {
      date: `${year}-03-15`,
      description: 'Vorauszahlung Q1 (Einkommensteuer)',
      type: 'payment'
    },
    {
      date: `${year}-04-30`,
      description: 'Einkommensteuererklärung Vorjahr (ohne Steuerberater)',
      type: 'filing'
    },
    {
      date: `${year}-06-15`,
      description: 'Vorauszahlung Q2 (Einkommensteuer)',
      type: 'payment'
    },
    {
      date: `${year}-09-15`,
      description: 'Vorauszahlung Q3 (Einkommensteuer)',
      type: 'payment'
    },
    {
      date: `${year}-12-15`,
      description: 'Vorauszahlung Q4 (Einkommensteuer)',
      type: 'payment'
    }
  ]
}
