import {
  calculateOccupancyRate,
  calculateRevenuePerSession,
  calculateCostPerSession,
  calculateProfitMarginPercent,
  calculateTrendPercent,
  calculateBreakEvenDistance,
  calculateContributionMargin,
  calculateAverageTherapyPrice,
  forecastRevenue,
  calculateWeightedContributionMargin,
  getProfiabilityStatus,
  formatPercent,
  getTrendDirection,
} from '@/lib/utils/kpi-helpers'

describe('KPI Helpers', () => {
  describe('calculateOccupancyRate', () => {
    it('should calculate occupancy rate correctly', () => {
      expect(calculateOccupancyRate(40, 100)).toBe(40)
      expect(calculateOccupancyRate(75, 100)).toBe(75)
    })

    it('should return 0 when planned sessions is 0', () => {
      expect(calculateOccupancyRate(10, 0)).toBe(0)
    })

    it('should handle fractional results', () => {
      expect(calculateOccupancyRate(1, 3)).toBeCloseTo(33.33, 1)
    })
  })

  describe('calculateRevenuePerSession', () => {
    it('should calculate revenue per session correctly', () => {
      expect(calculateRevenuePerSession(1000, 10)).toBe(100)
      expect(calculateRevenuePerSession(2500, 5)).toBe(500)
    })

    it('should return 0 when total sessions is 0', () => {
      expect(calculateRevenuePerSession(1000, 0)).toBe(0)
    })
  })

  describe('calculateCostPerSession', () => {
    it('should calculate cost per session correctly', () => {
      expect(calculateCostPerSession(500, 10)).toBe(50)
      expect(calculateCostPerSession(1200, 4)).toBe(300)
    })

    it('should return 0 when total sessions is 0', () => {
      expect(calculateCostPerSession(500, 0)).toBe(0)
    })
  })

  describe('calculateProfitMarginPercent', () => {
    it('should calculate profit margin percentage correctly', () => {
      expect(calculateProfitMarginPercent(200, 1000)).toBe(20)
      expect(calculateProfitMarginPercent(500, 2000)).toBe(25)
    })

    it('should handle negative net income', () => {
      expect(calculateProfitMarginPercent(-200, 1000)).toBe(-20)
    })

    it('should return 0 when total revenue is 0', () => {
      expect(calculateProfitMarginPercent(100, 0)).toBe(0)
    })
  })

  describe('calculateTrendPercent', () => {
    it('should calculate positive trend correctly', () => {
      expect(calculateTrendPercent(150, 100)).toBe(50)
      expect(calculateTrendPercent(200, 100)).toBe(100)
    })

    it('should calculate negative trend correctly', () => {
      expect(calculateTrendPercent(50, 100)).toBe(-50)
      expect(calculateTrendPercent(0, 100)).toBe(-100)
    })

    it('should return null when previous is 0', () => {
      expect(calculateTrendPercent(100, 0)).toBeNull()
    })

    it('should return null when both are 0', () => {
      expect(calculateTrendPercent(0, 0)).toBeNull()
    })
  })

  describe('calculateBreakEvenDistance', () => {
    it('should calculate break-even sessions correctly', () => {
      expect(calculateBreakEvenDistance(5000, 100)).toBe(50)
      expect(calculateBreakEvenDistance(10000, 200)).toBe(50)
    })

    it('should return Infinity when contribution margin is <= 0', () => {
      expect(calculateBreakEvenDistance(5000, 0)).toBe(Infinity)
      expect(calculateBreakEvenDistance(5000, -50)).toBe(Infinity)
    })
  })

  describe('calculateContributionMargin', () => {
    it('should calculate contribution margin correctly', () => {
      expect(calculateContributionMargin(1000, 400)).toBe(600)
      expect(calculateContributionMargin(5000, 2000)).toBe(3000)
    })

    it('should handle negative contribution margin', () => {
      expect(calculateContributionMargin(1000, 1500)).toBe(-500)
    })
  })

  describe('calculateAverageTherapyPrice', () => {
    it('should calculate average price correctly', () => {
      expect(calculateAverageTherapyPrice([100, 200, 300])).toBe(200)
      expect(calculateAverageTherapyPrice([50, 75, 100])).toBe(75)
    })

    it('should return 0 for empty array', () => {
      expect(calculateAverageTherapyPrice([])).toBe(0)
    })

    it('should handle single price', () => {
      expect(calculateAverageTherapyPrice([150])).toBe(150)
    })
  })

  describe('forecastRevenue', () => {
    it('should forecast revenue based on trend', () => {
      // Upward trend: 100, 120, 140 -> forecast should increase
      const forecast = forecastRevenue([100, 120, 140])
      expect(forecast).toBeGreaterThan(140)
    })

    it('should apply growth factor', () => {
      const baseline = forecastRevenue([100, 110, 120], 1.0)
      const withGrowth = forecastRevenue([100, 110, 120], 1.1)
      expect(withGrowth).toBeGreaterThan(baseline)
    })

    it('should return 0 for empty array', () => {
      expect(forecastRevenue([])).toBe(0)
    })
  })

  describe('calculateWeightedContributionMargin', () => {
    it('should calculate weighted contribution margin correctly', () => {
      const therapies = [
        { sessions: 10, margin: 100 },
        { sessions: 20, margin: 80 },
      ]
      const wcm = calculateWeightedContributionMargin(therapies)
      // (10*100 + 20*80) / 30 = 2600 / 30 = 86.67
      expect(wcm).toBeCloseTo(86.67, 1)
    })

    it('should return 0 for empty array', () => {
      expect(calculateWeightedContributionMargin([])).toBe(0)
    })

    it('should handle single therapy', () => {
      const therapies = [{ sessions: 10, margin: 150 }]
      expect(calculateWeightedContributionMargin(therapies)).toBe(150)
    })
  })

  describe('getProfiabilityStatus', () => {
    it('should return surplus for income > 100', () => {
      expect(getProfiabilityStatus(500)).toBe('surplus')
      expect(getProfiabilityStatus(101)).toBe('surplus')
    })

    it('should return breakeven for income between -100 and 100 (inclusive)', () => {
      expect(getProfiabilityStatus(0)).toBe('breakeven')
      expect(getProfiabilityStatus(50)).toBe('breakeven')
      expect(getProfiabilityStatus(-50)).toBe('breakeven')
      expect(getProfiabilityStatus(100)).toBe('breakeven')
      expect(getProfiabilityStatus(-100)).toBe('breakeven')
    })

    it('should return deficit for income < -100', () => {
      expect(getProfiabilityStatus(-500)).toBe('deficit')
      expect(getProfiabilityStatus(-101)).toBe('deficit')
    })
  })

  describe('formatPercent', () => {
    it('should format percentage correctly', () => {
      expect(formatPercent(25)).toBe('25.0%')
      expect(formatPercent(33.333)).toBe('33.3%')
    })

    it('should handle decimals parameter', () => {
      expect(formatPercent(25.567, 2)).toBe('25.57%')
      expect(formatPercent(25, 0)).toBe('25%')
    })
  })

  describe('getTrendDirection', () => {
    it('should return up for positive trend', () => {
      expect(getTrendDirection(5)).toBe('up')
      expect(getTrendDirection(10)).toBe('up')
    })

    it('should return down for negative trend', () => {
      expect(getTrendDirection(-5)).toBe('down')
      expect(getTrendDirection(-10)).toBe('down')
    })

    it('should return flat for trend between -1 and 1', () => {
      expect(getTrendDirection(0.5)).toBe('flat')
      expect(getTrendDirection(-0.5)).toBe('flat')
      expect(getTrendDirection(0)).toBe('flat')
    })

    it('should return flat for null trend', () => {
      expect(getTrendDirection(null)).toBe('flat')
    })
  })
})
