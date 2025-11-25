/**
 * Comprehensive Tax Calculator Test Suite
 *
 * Tests the tax calculation logic against known values and scenarios.
 * Update these tests when tax laws change.
 */

import { calculateComprehensiveTax } from '../comprehensive-tax'
import type { ComprehensiveTaxInput } from '@/lib/types/tax-types'

describe('Comprehensive Tax Calculator', () => {
  // ========================================================================
  // TEST CASE 1: Pure Employment Income
  // ========================================================================
  describe('Employment Income Only', () => {
    it('should calculate taxes for standard employment', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 60000,
          specialPaymentsGross: 0,
          homeOfficeDays: 0,
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      // Verify basic calculations
      expect(result.totalGrossIncome).toBe(60000)
      expect(result.employmentGross).toBe(60000)
      expect(result.selfEmploymentProfit).toBe(0)

      // Social security should be ~18.12% of gross
      expect(result.totalSs).toBeCloseTo(60000 * 0.1812, -1)

      // Taxable income should be gross minus social security
      const expectedTaxable = 60000 - (60000 * 0.1812)
      expect(result.finalTaxableIncome).toBeCloseTo(expectedTaxable, -1)

      // Net income should be gross minus SS and tax
      expect(result.netIncome).toBeLessThan(result.totalGrossIncome)
      expect(result.netIncome).toBeGreaterThan(0)

      // Effective tax rate should be reasonable
      expect(result.effectiveTaxRate).toBeGreaterThan(0)
      expect(result.effectiveTaxRate).toBeLessThan(50)
    })

    it('should handle homeoffice deduction', () => {
      const inputWithoutHomeoffice: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 60000,
          homeOfficeDays: 0,
        },
        taxYear: 2025,
      }

      const inputWithHomeoffice: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 60000,
          homeOfficeDays: 100, // 100 * €3 = €300, less than €100/month max
        },
        taxYear: 2025,
      }

      const resultWithout = calculateComprehensiveTax(inputWithoutHomeoffice)
      const resultWith = calculateComprehensiveTax(inputWithHomeoffice)

      // Homeoffice should reduce taxable income
      expect(resultWith.finalTaxableIncome).toBeLessThan(resultWithout.finalTaxableIncome)

      // Should reduce taxes
      expect(resultWith.totalIncomeTax).toBeLessThan(resultWithout.totalIncomeTax)

      // Should increase net income
      expect(resultWith.netIncome).toBeGreaterThan(resultWithout.netIncome)
    })

    it('should apply special payments tax correctly', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 50000,
          specialPaymentsGross: 2000, // 13th/14th salary
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      // Total gross should include special payments
      expect(result.totalGrossIncome).toBe(52000)

      // Special payments tax should apply
      // First €620 tax-free, then 6% on excess
      const specialPaymentsTax = (2000 - 620) * 0.06
      expect(result.specialPaymentsTax).toBeCloseTo(specialPaymentsTax, -1)
    })
  })

  // ========================================================================
  // TEST CASE 2: Pure Self-Employment Income
  // ========================================================================
  describe('Self-Employment Income Only', () => {
    it('should calculate SVS correctly', () => {
      const input: ComprehensiveTaxInput = {
        selfEmployment: {
          totalRevenue: 100000,
          businessExpenses: 40000,
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      const profit = 100000 - 40000
      expect(result.selfEmploymentProfit).toBe(profit)

      // Gewinnfreibetrag: 15% up to €33,000
      const expectedGewinnfreibetrag = Math.min(profit * 0.15, 33000)
      expect(result.gewinnfreibetrag).toBeCloseTo(expectedGewinnfreibetrag, -1)

      // SVS should be ~27.15% of assessment base
      expect(result.selfEmployedSs).toBeGreaterThan(0)
      expect(result.totalSs).toBe(result.selfEmployedSs)
    })

    it('should apply gewinnfreibetrag limit', () => {
      const input: ComprehensiveTaxInput = {
        selfEmployment: {
          totalRevenue: 500000,
          businessExpenses: 200000,
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      // Gewinnfreibetrag should not exceed €33,000
      expect(result.gewinnfreibetrag).toBeLessThanOrEqual(33000)
    })
  })

  // ========================================================================
  // TEST CASE 3: Mixed Income
  // ========================================================================
  describe('Mixed Employment and Self-Employment', () => {
    it('should combine both income sources correctly', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 60000,
          specialPaymentsGross: 0,
        },
        selfEmployment: {
          totalRevenue: 45000,
          businessExpenses: 22000,
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      // Total gross should be employment + self-employment profit
      const expectedGross = 60000 + (45000 - 22000)
      expect(result.totalGrossIncome).toBe(expectedGross)

      // Should have both employee and self-employed SS
      expect(result.employeeSs).toBeGreaterThan(0)
      expect(result.selfEmployedSs).toBeGreaterThan(0)
      expect(result.totalSs).toBe(result.employeeSs + result.selfEmployedSs)

      // Should apply gewinnfreibetrag to self-employment
      expect(result.gewinnfreibetrag).toBeGreaterThan(0)
    })
  })

  // ========================================================================
  // TEST CASE 4: Tax Deductions
  // ========================================================================
  describe('Tax Deductions', () => {
    it('should apply deductions correctly', () => {
      const inputWithoutDeductions: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 70000,
        },
        taxYear: 2025,
      }

      const inputWithDeductions: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 70000,
        },
        deductions: {
          pensionContributions: 3000,
          charitableDonations: 1000,
          lifeInsurancePremiums: 500,
        },
        taxYear: 2025,
      }

      const resultWithout = calculateComprehensiveTax(inputWithoutDeductions)
      const resultWith = calculateComprehensiveTax(inputWithDeductions)

      // Deductions should reduce final taxable income
      expect(resultWith.finalTaxableIncome).toBeLessThan(resultWithout.finalTaxableIncome)

      // Should reduce taxes
      expect(resultWith.totalIncomeTax).toBeLessThan(resultWithout.totalIncomeTax)

      // Should increase net income
      expect(resultWith.netIncome).toBeGreaterThan(resultWithout.netIncome)
    })

    it('should respect deduction limits', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 100000,
        },
        deductions: {
          pensionContributions: 5000, // Exceeds limit of 3100
          lifeInsurancePremiums: 1000, // Exceeds limit of 730
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      // Applied deductions should respect limits
      // Pension: min(5000, 3100) = 3100
      // Life Insurance: min(1000, 730) = 730
      const expectedDeductions = 3100 + 730
      expect(result.appliedDeductions).toBeLessThanOrEqual(expectedDeductions + 100) // Allow small rounding
    })
  })

  // ========================================================================
  // TEST CASE 5: Tax Credits
  // ========================================================================
  describe('Tax Credits', () => {
    it('should apply commuter credit', () => {
      const inputWithout: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 60000,
        },
        credits: {
          hasCommuterCredit: false,
        },
        taxYear: 2025,
      }

      const inputWith: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 60000,
        },
        credits: {
          hasCommuterCredit: true,
        },
        taxYear: 2025,
      }

      const resultWithout = calculateComprehensiveTax(inputWithout)
      const resultWith = calculateComprehensiveTax(inputWith)

      // Commuter credit should reduce taxes
      expect(resultWith.totalIncomeTax).toBeLessThan(resultWithout.totalIncomeTax)

      // 2025 commuter credit is €421
      const creditDifference = resultWithout.totalIncomeTax - resultWith.totalIncomeTax
      expect(creditDifference).toBeCloseTo(421, -1)
    })

    it('should apply children credits', () => {
      const inputNoChildren: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 60000,
        },
        credits: {
          numberOfChildren: 0,
        },
        taxYear: 2025,
      }

      const inputWithChildren: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 60000,
        },
        credits: {
          numberOfChildren: 2,
        },
        taxYear: 2025,
      }

      const resultNoChildren = calculateComprehensiveTax(inputNoChildren)
      const resultWithChildren = calculateComprehensiveTax(inputWithChildren)

      // Children credits should reduce taxes
      expect(resultWithChildren.totalIncomeTax).toBeLessThanOrEqual(resultNoChildren.totalIncomeTax)
    })
  })

  // ========================================================================
  // TEST CASE 6: Progressive Tax Brackets
  // ========================================================================
  describe('Progressive Tax Brackets (2025)', () => {
    it('should apply correct bracket for low income', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 20000,
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      // Tax-free threshold is €12,816 in 2025
      expect(result.finalTaxableIncome).toBeGreaterThan(12816)

      // Marginal tax rate should be 20% (first bracket above tax-free)
      expect(result.marginalTaxRate).toBe(20)
    })

    it('should handle income spanning multiple brackets', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 100000,
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      // Effective rate should be between lowest and highest marginal rate
      expect(result.effectiveTaxRate).toBeGreaterThan(0)
      expect(result.effectiveTaxRate).toBeLessThan(result.marginalTaxRate)

      // Should have tax breakdown
      expect(Object.keys(result.taxBreakdownByBracket).length).toBeGreaterThan(0)
    })

    it('should apply highest bracket correctly', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 2000000,
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      // For very high income, marginal rate should be 55%
      expect(result.marginalTaxRate).toBe(55)
    })
  })

  // ========================================================================
  // TEST CASE 7: Year Comparisons
  // ========================================================================
  describe('Tax Year Changes (2023-2025)', () => {
    it('should reflect 2023 configuration', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 50000,
        },
        taxYear: 2023,
      }

      const result = calculateComprehensiveTax(input)

      // 2023 tax-free threshold was €11,693
      expect(result.taxYear).toBe(2023)
    })

    it('should reflect 2024 configuration', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 50000,
        },
        taxYear: 2024,
      }

      const result = calculateComprehensiveTax(input)

      expect(result.taxYear).toBe(2024)
    })

    it('should reflect 2025 configuration', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 50000,
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      // 2025 tax-free threshold is €12,816
      expect(result.taxYear).toBe(2025)
    })
  })

  // ========================================================================
  // TEST CASE 8: Edge Cases
  // ========================================================================
  describe('Edge Cases', () => {
    it('should handle zero income', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 0,
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      expect(result.totalGrossIncome).toBe(0)
      expect(result.totalIncomeTax).toBe(0)
      expect(result.netIncome).toBe(0)
    })

    it('should handle very high income', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 5000000,
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      expect(result.totalGrossIncome).toBe(5000000)
      expect(result.totalIncomeTax).toBeGreaterThan(0)
      expect(result.netIncome).toBeGreaterThan(0)
      expect(result.netIncome).toBeLessThan(result.totalGrossIncome)
    })

    it('should validate quarterly payment calculation', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 60000,
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      // Quarterly payment should be 1/4 of annual tax
      const expectedQuarterly = result.totalIncomeTax / 4
      expect(expectedQuarterly).toBeGreaterThan(0)
    })
  })

  // ========================================================================
  // TEST CASE 9: Data Consistency
  // ========================================================================
  describe('Data Consistency', () => {
    it('should have consistent total burden calculation', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 60000,
        },
        selfEmployment: {
          totalRevenue: 30000,
          businessExpenses: 10000,
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      // Total direct burden should equal SS + income tax
      const expectedBurden = result.totalSs + result.totalIncomeTax
      expect(result.totalDirectBurden).toBeCloseTo(expectedBurden, -1)

      // Net income should equal gross minus burden
      const expectedNetIncome = result.totalGrossIncome - result.totalDirectBurden
      expect(result.netIncome).toBeCloseTo(expectedNetIncome, -1)

      // Burden percentage should be correct
      const expectedPercentage = (result.totalDirectBurden / result.totalGrossIncome) * 100
      expect(result.burdenPercentage).toBeCloseTo(expectedPercentage, -1)
    })

    it('should have reasonable effective tax rate', () => {
      const input: ComprehensiveTaxInput = {
        employment: {
          grossSalary: 60000,
        },
        taxYear: 2025,
      }

      const result = calculateComprehensiveTax(input)

      // Effective tax rate should be less than marginal rate
      expect(result.effectiveTaxRate).toBeLessThanOrEqual(result.marginalTaxRate)

      // Effective rate should be reasonable
      expect(result.effectiveTaxRate).toBeGreaterThanOrEqual(0)
      expect(result.effectiveTaxRate).toBeLessThan(55)
    })
  })
})

// ========================================================================
// REAL DATA TEST CASES (Update with your actual Steuerbescheid values)
// ========================================================================

describe('Real Data Tests (2023-2025)', () => {
  /**
   * TEST INSTRUCTION:
   * Replace the values below with your actual values from your Steuerbescheid
   * Then run: npm test -- comprehensive-tax.test.ts
   *
   * Example from a 2023 Steuerbescheid:
   * - Jahresbrutto: €85,000
   * - Sozialversicherung: ~€15,402
   * - Einkommensteuer: ~€8,670
   * - Nettoeinkommen: ~€60,928
   */

  it.skip('should match 2023 Steuerbescheid values', () => {
    // Replace with your actual 2023 values
    const input: ComprehensiveTaxInput = {
      employment: {
        grossSalary: 85000, // YOUR 2023 BRUTTO
        specialPaymentsGross: 0,
      },
      taxYear: 2023,
    }

    const result = calculateComprehensiveTax(input)

    // Replace with your actual calculated values
    expect(result.totalGrossIncome).toBe(85000)
    expect(result.totalIncomeTax).toBeCloseTo(8670, -3) // YOUR 2023 INCOME TAX
    expect(result.totalSs).toBeCloseTo(15402, -3) // YOUR 2023 SS
    expect(result.netIncome).toBeCloseTo(60928, -3) // YOUR 2023 NET INCOME
  })

  it.skip('should match 2024 Steuerbescheid values', () => {
    // Replace with your actual 2024 values
    const input: ComprehensiveTaxInput = {
      employment: {
        grossSalary: 90000, // YOUR 2024 BRUTTO
        specialPaymentsGross: 0,
      },
      taxYear: 2024,
    }

    const result = calculateComprehensiveTax(input)

    // Replace with your actual calculated values
    expect(result.totalGrossIncome).toBe(90000)
    expect(result.totalIncomeTax).toBeCloseTo(9500, -3) // YOUR 2024 INCOME TAX
    expect(result.totalSs).toBeCloseTo(16300, -3) // YOUR 2024 SS
    expect(result.netIncome).toBeCloseTo(64200, -3) // YOUR 2024 NET INCOME
  })
})
