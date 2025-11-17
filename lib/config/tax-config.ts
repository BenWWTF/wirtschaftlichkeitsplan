/**
 * Austrian Tax Configuration
 *
 * Centralized configuration for tax rates, brackets, and limits
 * Update this file when tax laws change (usually announced December)
 * Supports years 2023-2025+
 */

import type { TaxYearConfig, TaxBracket, SocialSecurityConfig } from '@/lib/types/tax-types'

// ========================================================================
// 2025 CONFIGURATION (Current)
// ========================================================================

export const TAX_CONFIG_2025: TaxYearConfig = {
  year: 2025,

  // Progressive income tax brackets
  taxBrackets: [
    {
      upperLimit: 12816,
      rate: 0.0,
      description: '€0 - €12,816 at 0% (tax-free)',
    },
    {
      upperLimit: 20818,
      rate: 0.2,
      description: '€12,817 - €20,818 at 20%',
    },
    {
      upperLimit: 34513,
      rate: 0.3,
      description: '€20,819 - €34,513 at 30%',
    },
    {
      upperLimit: 66612,
      rate: 0.41,
      description: '€34,514 - €66,612 at 41%',
    },
    {
      upperLimit: 99266,
      rate: 0.48,
      description: '€66,613 - €99,266 at 48%',
    },
    {
      upperLimit: 1000000,
      rate: 0.5,
      description: '€99,267 - €1,000,000 at 50%',
    },
    {
      upperLimit: Number.MAX_SAFE_INTEGER,
      rate: 0.55,
      description: '€1,000,001+ at 55%',
    },
  ] as TaxBracket[],

  // Social security rates and limits
  socialSecurity: {
    employeeRateRegular: 0.1812, // 18.12%
    employeeRateSpecial: 0.1712, // 17.12% on special payments
    selfEmployedRate: 0.2715, // ~27.15%
    minAssessmentBase: 7200,
    maxAssessmentBase: 90000,
    componentRates: {
      pensionRate: 0.1025, // 10.25%
      healthRate: 0.0387, // 3.87%
      unemploymentRate: 0.03, // 3%
      accidentRate: 0.01, // 1%
    },
  } as SocialSecurityConfig,

  // Tax credits (Absetzbeträge)
  taxCredits: {
    verkehrsabsetzbetrag: 421, // Commuter credit
    alleinverdienerSingle: 494,
    alleinverdienerWith1Child: 669,
    alleinverdienerWithMoreChildren: 669,
  },

  // Deduction limits
  deductionLimits: {
    lifeInsuranceMax: 730,
    pensionContributionMax: 3100,
    gewinnfreibetragRate: 0.15, // 15%
    gewinnfreibetragLimit: 33000, // Up to €33,000
    homeofficeDaily: 3, // €3 per day
    homeofficeMonthlyMax: 100, // Max €100/month
  },

  // Special payments (13th, 14th salary) taxation
  specialPayments: {
    taxFreeLimit: 620, // First €620 tax-free
    taxRate: 0.06, // 6% on excess
  },
}

// ========================================================================
// 2024 CONFIGURATION (Previous year)
// ========================================================================

export const TAX_CONFIG_2024: TaxYearConfig = {
  year: 2024,

  taxBrackets: [
    {
      upperLimit: 12200,
      rate: 0.0,
      description: '€0 - €12,200 at 0%',
    },
    {
      upperLimit: 20000,
      rate: 0.2,
      description: '€12,201 - €20,000 at 20%',
    },
    {
      upperLimit: 34000,
      rate: 0.3,
      description: '€20,001 - €34,000 at 30%',
    },
    {
      upperLimit: 66000,
      rate: 0.41,
      description: '€34,001 - €66,000 at 41%',
    },
    {
      upperLimit: 99000,
      rate: 0.48,
      description: '€66,001 - €99,000 at 48%',
    },
    {
      upperLimit: 1000000,
      rate: 0.5,
      description: '€99,001 - €1,000,000 at 50%',
    },
    {
      upperLimit: Number.MAX_SAFE_INTEGER,
      rate: 0.55,
      description: '€1,000,001+ at 55%',
    },
  ] as TaxBracket[],

  socialSecurity: {
    employeeRateRegular: 0.1812,
    employeeRateSpecial: 0.1712,
    selfEmployedRate: 0.2715,
    minAssessmentBase: 7050,
    maxAssessmentBase: 88200,
    componentRates: {
      pensionRate: 0.1025,
      healthRate: 0.0387,
      unemploymentRate: 0.03,
      accidentRate: 0.01,
    },
  } as SocialSecurityConfig,

  taxCredits: {
    verkehrsabsetzbetrag: 400,
    alleinverdienerSingle: 476,
    alleinverdienerWith1Child: 644,
    alleinverdienerWithMoreChildren: 644,
  },

  deductionLimits: {
    lifeInsuranceMax: 696,
    pensionContributionMax: 3000,
    gewinnfreibetragRate: 0.15,
    gewinnfreibetragLimit: 33000,
    homeofficeDaily: 3,
    homeofficeMonthlyMax: 100,
  },

  specialPayments: {
    taxFreeLimit: 620,
    taxRate: 0.06,
  },
}

// ========================================================================
// 2023 CONFIGURATION (Legacy)
// ========================================================================

export const TAX_CONFIG_2023: TaxYearConfig = {
  year: 2023,

  taxBrackets: [
    {
      upperLimit: 11693,
      rate: 0.0,
      description: '€0 - €11,693 at 0%',
    },
    {
      upperLimit: 19134,
      rate: 0.2,
      description: '€11,694 - €19,134 at 20%',
    },
    {
      upperLimit: 32075,
      rate: 0.3,
      description: '€19,135 - €32,075 at 30%',
    },
    {
      upperLimit: 62080,
      rate: 0.41,
      description: '€32,076 - €62,080 at 41%',
    },
    {
      upperLimit: 93120,
      rate: 0.48,
      description: '€62,081 - €93,120 at 48%',
    },
    {
      upperLimit: 1000000,
      rate: 0.5,
      description: '€93,121 - €1,000,000 at 50%',
    },
    {
      upperLimit: Number.MAX_SAFE_INTEGER,
      rate: 0.55,
      description: '€1,000,001+ at 55%',
    },
  ] as TaxBracket[],

  socialSecurity: {
    employeeRateRegular: 0.1812,
    employeeRateSpecial: 0.1712,
    selfEmployedRate: 0.2745, // ~27.45%
    minAssessmentBase: 6900,
    maxAssessmentBase: 86220,
    componentRates: {
      pensionRate: 0.185,
      healthRate: 0.0745,
      unemploymentRate: 0.0,
      accidentRate: 0.012,
    },
  } as SocialSecurityConfig,

  taxCredits: {
    verkehrsabsetzbetrag: 421,
    alleinverdienerSingle: 494,
    alleinverdienerWith1Child: 669,
    alleinverdienerWithMoreChildren: 669,
  },

  deductionLimits: {
    lifeInsuranceMax: 696,
    pensionContributionMax: 3000,
    gewinnfreibetragRate: 0.15,
    gewinnfreibetragLimit: 33000,
    homeofficeDaily: 3,
    homeofficeMonthlyMax: 100,
  },

  specialPayments: {
    taxFreeLimit: 620,
    taxRate: 0.06,
  },
}

// ========================================================================
// CONFIGURATION LOOKUP
// ========================================================================

const CONFIG_MAP: Record<number, TaxYearConfig> = {
  2023: TAX_CONFIG_2023,
  2024: TAX_CONFIG_2024,
  2025: TAX_CONFIG_2025,
}

/**
 * Get tax configuration for a specific year
 */
export function getTaxConfig(year: number): TaxYearConfig {
  if (year in CONFIG_MAP) {
    return CONFIG_MAP[year]
  }

  // Default to most recent (2025) for future years
  return TAX_CONFIG_2025
}

/**
 * Get current year's tax configuration
 */
export function getCurrentTaxConfig(): TaxYearConfig {
  const currentYear = new Date().getFullYear()
  return getTaxConfig(currentYear)
}

/**
 * Get tax brackets for a specific year
 */
export function getTaxBrackets(year: number): TaxBracket[] {
  return getTaxConfig(year).taxBrackets
}

/**
 * Get social security configuration for a specific year
 */
export function getSocialSecurityConfig(year: number): SocialSecurityConfig {
  return getTaxConfig(year).socialSecurity
}

/**
 * Get supported tax years
 */
export function getSupportedYears(): number[] {
  return Object.keys(CONFIG_MAP)
    .map(Number)
    .sort((a, b) => b - a)
}

/**
 * Check if a year is supported
 */
export function isSupportedYear(year: number): boolean {
  return year in CONFIG_MAP
}

/**
 * Get the latest supported year
 */
export function getLatestSupportedYear(): number {
  return Math.max(...getSupportedYears())
}

/**
 * Compare configurations between two years
 */
export function compareYears(year1: number, year2: number): Record<string, any> {
  const config1 = getTaxConfig(year1)
  const config2 = getTaxConfig(year2)

  return {
    year1,
    year2,
    changes: {
      taxFreeThreshold: {
        [year1]: config1.taxBrackets[0].upperLimit,
        [year2]: config2.taxBrackets[0].upperLimit,
      },
      maxAssessmentBase: {
        [year1]: config1.socialSecurity.maxAssessmentBase,
        [year2]: config2.socialSecurity.maxAssessmentBase,
      },
      verkehrsabsetzbetrag: {
        [year1]: config1.taxCredits.verkehrsabsetzbetrag,
        [year2]: config2.taxCredits.verkehrsabsetzbetrag,
      },
      pensionMax: {
        [year1]: config1.deductionLimits.pensionContributionMax,
        [year2]: config2.deductionLimits.pensionContributionMax,
      },
    },
  }
}

/**
 * Format currency for display in Austrian locale
 */
export function formatEuro(amount: number, decimals: number = 0): string {
  return new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get all configuration objects
 */
export function getAllConfigs(): TaxYearConfig[] {
  return [TAX_CONFIG_2023, TAX_CONFIG_2024, TAX_CONFIG_2025]
}

/**
 * Print configuration summary for a year
 */
export function printConfigSummary(year: number): void {
  const config = getTaxConfig(year)

  console.log(`\n${'='.repeat(70)}`)
  console.log(`  AUSTRIAN TAX CONFIGURATION ${year}`)
  console.log(`${'='.repeat(70)}\n`)

  console.log('TAX BRACKETS:')
  config.taxBrackets.forEach((bracket, index) => {
    console.log(`  ${index + 1}. ${bracket.description}`)
  })

  console.log('\nSOCIAL SECURITY:')
  const ss = config.socialSecurity
  console.log(`  Employee (regular): ${(ss.employeeRateRegular * 100).toFixed(2)}%`)
  console.log(`  Employee (special): ${(ss.employeeRateSpecial * 100).toFixed(2)}%`)
  console.log(`  Self-employed: ${(ss.selfEmployedRate * 100).toFixed(2)}%`)
  console.log(`  Min assessment base: ${formatEuro(ss.minAssessmentBase)}`)
  console.log(`  Max assessment base: ${formatEuro(ss.maxAssessmentBase)}`)

  console.log('\nTAX CREDITS:')
  console.log(`  Verkehrsabsetzbetrag: ${formatEuro(config.taxCredits.verkehrsabsetzbetrag)}`)

  console.log('\nDEDUCTION LIMITS:')
  console.log(
    `  Gewinnfreibetrag: ${(config.deductionLimits.gewinnfreibetragRate * 100).toFixed(0)}% up to ${formatEuro(config.deductionLimits.gewinnfreibetragLimit)}`
  )
  console.log(
    `  Homeoffice: ${formatEuro(config.deductionLimits.homeofficeDaily)}/day, max ${formatEuro(config.deductionLimits.homeofficeMonthlyMax)}/month`
  )

  console.log(`\n${'='.repeat(70)}\n`)
}
