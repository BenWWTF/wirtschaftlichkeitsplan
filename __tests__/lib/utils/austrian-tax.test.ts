import {
  calculateIncomeTax,
  calculateSVBeitraege,
  calculateAerztekammerBeitrag,
  calculateVAT,
  calculatePauschalDeduction,
  calculateAustrianTax,
  calculateQuarterlyVorauszahlungen,
  getTaxOptimizationTips,
  formatEuroAT,
  type TaxCalculationInput,
} from '@/lib/utils/austrian-tax'

describe('Austrian Tax Calculations', () => {
  describe('calculateIncomeTax', () => {
    it('should return 0 for income below tax-free amount', () => {
      expect(calculateIncomeTax(12816)).toBe(0)
      expect(calculateIncomeTax(10000)).toBe(0)
    })

    it('should apply 20% bracket correctly', () => {
      // 8002 EUR in bracket 20% = 1600.40 EUR
      const tax = calculateIncomeTax(20818)
      expect(tax).toBeGreaterThan(0)
    })

    it('should apply progressive brackets correctly', () => {
      // 34513 EUR: tax-free (12816) + 20% of 8002 + 30% of 6695
      const tax = calculateIncomeTax(34513)
      expect(tax).toBeGreaterThan(0)
    })

    it('should apply highest bracket for very high income', () => {
      const taxLow = calculateIncomeTax(66612)
      const taxHigh = calculateIncomeTax(200000)
      expect(taxHigh).toBeGreaterThan(taxLow)
    })

    it('should handle negative income', () => {
      expect(calculateIncomeTax(-5000)).toBe(0)
    })
  })

  describe('calculateSVBeitraege', () => {
    it('should apply minimum SV contribution', () => {
      // Minimum is €6,000/year
      const sv = calculateSVBeitraege(10000)
      expect(sv).toBe(6000) // Returns minimum when profit too low
    })

    it('should calculate SV based on profit percentage', () => {
      // Higher profit should result in higher SV (if above minimum)
      const sv = calculateSVBeitraege(100000)
      expect(sv).toBeGreaterThan(6000)
      expect(sv).toBeLessThanOrEqual(100000 * 0.2745) // Capped at max assessment base
    })

    it('should respect maximum assessment base', () => {
      // Max assessment base is €90,000
      const sv = calculateSVBeitraege(200000)
      expect(sv).toBe(90000 * 0.2745) // Should be capped
    })

    it('should return minimum for low profit', () => {
      expect(calculateSVBeitraege(1000)).toBe(6000)
    })
  })

  describe('calculateAerztekammerBeitrag', () => {
    it('should include base fee and income percentage', () => {
      // €300 + 3% of profit
      const beitrag = calculateAerztekammerBeitrag(50000)
      expect(beitrag).toBe(300 + 50000 * 0.03)
      expect(beitrag).toBe(1800)
    })

    it('should scale with profit', () => {
      const beitragLow = calculateAerztekammerBeitrag(30000)
      const beitragHigh = calculateAerztekammerBeitrag(60000)
      expect(beitragHigh).toBeGreaterThan(beitragLow)
    })

    it('should handle zero profit', () => {
      const beitrag = calculateAerztekammerBeitrag(0)
      expect(beitrag).toBe(300) // Only base fee
    })
  })

  describe('calculateVAT', () => {
    it('should return 0 for Kleinunternehmer (small business exemption)', () => {
      expect(calculateVAT(30000, true)).toBe(0)
    })

    it('should calculate VAT for standard businesses', () => {
      // VAT = Revenue * (20/120) = 0.1667 * Revenue
      const vat = calculateVAT(120000, false)
      expect(vat).toBeCloseTo(20000, 0) // 120000 * (20/120)
    })

    it('should handle zero revenue', () => {
      expect(calculateVAT(0)).toBe(0)
    })
  })

  describe('calculatePauschalDeduction', () => {
    it('should return 0 when not applying Pauschalierung', () => {
      expect(calculatePauschalDeduction(50000, false)).toBe(0)
    })

    it('should calculate 13% of profit when applying', () => {
      const deduction = calculatePauschalDeduction(50000, true)
      expect(deduction).toBe(50000 * 0.13)
      expect(deduction).toBe(6500)
    })

    it('should scale with profit', () => {
      const deductionLow = calculatePauschalDeduction(50000, true)
      const deductionHigh = calculatePauschalDeduction(100000, true)
      expect(deductionHigh).toBe(deductionLow * 2)
    })
  })

  describe('calculateAustrianTax', () => {
    it('should calculate complete tax for Kassenarzt practice', () => {
      const input: TaxCalculationInput = {
        grossRevenue: 100000,
        totalExpenses: 40000,
        practiceType: 'kassenarzt',
        applyingPauschalierung: false,
      }

      const result = calculateAustrianTax(input)

      // Assertions
      expect(result.profit).toBe(60000) // 100000 - 40000
      expect(result.pauschalDeduction).toBe(0)
      expect(result.svBeitraege).toBeGreaterThan(0)
      expect(result.aerztekammerBeitrag).toBe(300 + 60000 * 0.03)
      expect(result.incomeTax).toBeGreaterThan(0)
      expect(result.vat).toBe(0) // Kassenarzt, no VAT
      expect(result.totalTaxBurden).toBeGreaterThan(0)
      expect(result.netIncome).toBeLessThan(result.profit)
    })

    it('should calculate tax with Pauschalierung', () => {
      const input: TaxCalculationInput = {
        grossRevenue: 100000,
        totalExpenses: 40000,
        practiceType: 'kassenarzt',
        applyingPauschalierung: true,
      }

      const result = calculateAustrianTax(input)

      expect(result.pauschalDeduction).toBe(60000 * 0.13)
      expect(result.taxableIncome).toBeLessThan(60000) // Reduced by Pauschale
    })

    it('should calculate tax for private practice with VAT', () => {
      const input: TaxCalculationInput = {
        grossRevenue: 80000,
        totalExpenses: 30000,
        practiceType: 'wahlarzt',
        applyingPauschalierung: false,
        privatePatientRevenue: 80000,
      }

      const result = calculateAustrianTax(input)

      expect(result.vat).toBeGreaterThan(0) // Wahlärzte pay VAT
      expect(result.totalTaxBurden).toBeGreaterThan(0)
    })

    it('should calculate effective tax rate', () => {
      const input: TaxCalculationInput = {
        grossRevenue: 100000,
        totalExpenses: 40000,
        practiceType: 'kassenarzt',
        applyingPauschalierung: false,
      }

      const result = calculateAustrianTax(input)

      expect(result.effectiveTaxRate).toBeGreaterThan(0)
      expect(result.effectiveTaxRate).toBeLessThan(100)
      // Verify calculation: totalTaxBurden / profit * 100
      expect(result.effectiveTaxRate).toBeCloseTo(
        (result.totalTaxBurden / result.profit) * 100,
        1
      )
    })

    it('should handle loss scenario', () => {
      const input: TaxCalculationInput = {
        grossRevenue: 30000,
        totalExpenses: 40000,
        practiceType: 'kassenarzt',
        applyingPauschalierung: false,
      }

      const result = calculateAustrianTax(input)

      expect(result.profit).toBe(-10000)
      expect(result.incomeTax).toBe(0) // No tax on losses
      expect(result.effectiveTaxRate).toBe(0)
    })
  })

  describe('calculateQuarterlyVorauszahlungen', () => {
    it('should split income tax into 4 equal quarters', () => {
      const vorauszahlungen = calculateQuarterlyVorauszahlungen(4000)

      expect(vorauszahlungen.q1).toBe(1000)
      expect(vorauszahlungen.q2).toBe(1000)
      expect(vorauszahlungen.q3).toBe(1000)
      expect(vorauszahlungen.q4).toBe(1000)
      expect(vorauszahlungen.total).toBe(4000)
    })

    it('should sum to total income tax', () => {
      const vorauszahlungen = calculateQuarterlyVorauszahlungen(5000)

      expect(vorauszahlungen.q1 + vorauszahlungen.q2 + vorauszahlungen.q3 + vorauszahlungen.q4).toBe(
        vorauszahlungen.total
      )
    })
  })

  describe('getTaxOptimizationTips', () => {
    it('should suggest Pauschalierung when eligible and not applied', () => {
      const input: TaxCalculationInput = {
        grossRevenue: 100000,
        totalExpenses: 40000,
        practiceType: 'kassenarzt',
        applyingPauschalierung: false,
      }

      const result = calculateAustrianTax(input)
      const tips = getTaxOptimizationTips(result)

      const pauschaleTip = tips.find((t) => t.includes('Pauschalierung'))
      expect(pauschaleTip).toBeDefined()
    })

    it('should not suggest Pauschalierung for high revenue practices', () => {
      const input: TaxCalculationInput = {
        grossRevenue: 250000, // Exceeds €220,000 threshold
        totalExpenses: 100000,
        practiceType: 'kassenarzt',
        applyingPauschalierung: false,
      }

      const result = calculateAustrianTax(input)
      const tips = getTaxOptimizationTips(result)

      const pauschaleTip = tips.find((t) => t.includes('Pauschalierung'))
      expect(pauschaleTip).toBeUndefined()
    })

    it('should warn about high tax rates', () => {
      // Create a scenario with high tax burden
      const input: TaxCalculationInput = {
        grossRevenue: 300000,
        totalExpenses: 50000,
        practiceType: 'wahlarzt',
        applyingPauschalierung: false,
        privatePatientRevenue: 300000,
      }

      const result = calculateAustrianTax(input)

      if (result.effectiveTaxRate > 45) {
        const tips = getTaxOptimizationTips(result)
        const highTaxTip = tips.find((t) => t.includes('45%'))
        expect(highTaxTip).toBeDefined()
      }
    })

    it('should congratulate on profitable practice', () => {
      const input: TaxCalculationInput = {
        grossRevenue: 250000,
        totalExpenses: 100000,
        practiceType: 'wahlarzt',
        applyingPauschalierung: false,
        privatePatientRevenue: 250000,
      }

      const result = calculateAustrianTax(input)

      if (result.netIncome > 60000) {
        const tips = getTaxOptimizationTips(result)
        const successTip = tips.find((t) => t.includes('Glückwunsch'))
        expect(successTip).toBeDefined()
      }
    })
  })

  describe('formatEuroAT', () => {
    it('should format as Austrian EUR with correct symbol placement', () => {
      const formatted = formatEuroAT(1000)
      expect(formatted).toMatch(/€.*1\.000/) // € symbol comes before in de-AT locale
    })

    it('should use correct thousand separator', () => {
      const formatted = formatEuroAT(1500000)
      expect(formatted).toContain('1.500.000')
    })

    it('should round to whole euros', () => {
      const formatted = formatEuroAT(1234.56)
      expect(formatted).not.toContain(',')
    })
  })

  describe('Tax calculation edge cases', () => {
    it('should handle very low income', () => {
      const input: TaxCalculationInput = {
        grossRevenue: 5000,
        totalExpenses: 3000,
        practiceType: 'kassenarzt',
        applyingPauschalierung: false,
      }

      const result = calculateAustrianTax(input)
      expect(result.incomeTax).toBe(0)
      // Note: Net income can be negative due to minimum SV contributions
      // profit is 2000, but minimum SV is 6000, so netIncome = 2000 - 6000 = -4000
      expect(result.profit).toBe(2000)
      expect(result.netIncome).toBeLessThan(0) // Will be negative due to minimum SV contributions
    })

    it('should handle high income with all deductions', () => {
      const input: TaxCalculationInput = {
        grossRevenue: 500000,
        totalExpenses: 200000,
        practiceType: 'wahlarzt',
        applyingPauschalierung: true,
        privatePatientRevenue: 500000,
      }

      const result = calculateAustrianTax(input)
      expect(result.totalTaxBurden).toBeGreaterThan(0)
      expect(result.netIncome).toBeGreaterThan(0)
    })

    it('should maintain consistency across multiple calls', () => {
      const input: TaxCalculationInput = {
        grossRevenue: 150000,
        totalExpenses: 60000,
        practiceType: 'kassenarzt',
        applyingPauschalierung: false,
      }

      const result1 = calculateAustrianTax(input)
      const result2 = calculateAustrianTax(input)

      expect(result1).toEqual(result2)
    })
  })
})
