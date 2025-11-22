/**
 * Payment Fee Calculator Test Suite
 *
 * Tests for SumUp payment fee calculations (1.39% transaction fee).
 * Covers fee calculation, net revenue, break-even analysis, and growth projections.
 */

import {
  calculatePaymentFee,
  calculateNetRevenue,
  calculateNetRevenuePerSession,
  calculateBreakEvenSessionsWithFees,
  calculateMonthlyProfit,
  projectMonthGrossRevenue,
  calculateCumulativeProfit,
  findBreakEvenMonth,
  SUMUP_FEE_RATE,
} from '../payment-fees';

describe('Payment Fee Calculator', () => {
  // ========================================================================
  // CONSTANTS
  // ========================================================================
  describe('Constants', () => {
    it('should export the SumUp fee rate as 1.39%', () => {
      expect(SUMUP_FEE_RATE).toBe(0.0139);
    });
  });

  // ========================================================================
  // calculatePaymentFee - 1.39% fee on gross amounts
  // ========================================================================
  describe('calculatePaymentFee', () => {
    it('should calculate 1.39% fee on gross amount', () => {
      // 100 EUR * 0.0139 = 1.39 EUR
      expect(calculatePaymentFee(100)).toBe(1.39);
    });

    it('should calculate fee for typical session price (85 EUR)', () => {
      // 85 EUR * 0.0139 = 1.1815 EUR
      const fee = calculatePaymentFee(85);
      expect(fee).toBeCloseTo(1.18, 2);
    });

    it('should calculate fee for higher session price (120 EUR)', () => {
      // 120 EUR * 0.0139 = 1.668 EUR
      const fee = calculatePaymentFee(120);
      expect(fee).toBeCloseTo(1.67, 2);
    });

    it('should return 0 for zero gross amount', () => {
      expect(calculatePaymentFee(0)).toBe(0);
    });

    it('should handle large gross amounts correctly', () => {
      // 10,000 EUR * 0.0139 = 139 EUR
      expect(calculatePaymentFee(10000)).toBe(139);
    });

    it('should handle decimal gross amounts', () => {
      // 85.50 EUR * 0.0139 = 1.18845 EUR
      const fee = calculatePaymentFee(85.5);
      expect(fee).toBeCloseTo(1.19, 2);
    });
  });

  // ========================================================================
  // calculateNetRevenue - gross minus fees
  // ========================================================================
  describe('calculateNetRevenue', () => {
    it('should calculate net revenue as gross minus fee', () => {
      // 100 EUR - 1.39 EUR = 98.61 EUR
      expect(calculateNetRevenue(100)).toBe(98.61);
    });

    it('should calculate net for typical session price (85 EUR)', () => {
      // 85 EUR - (85 * 0.0139) = 85 - 1.1815 = 83.8185
      const net = calculateNetRevenue(85);
      expect(net).toBeCloseTo(83.82, 2);
    });

    it('should return 0 for zero gross', () => {
      expect(calculateNetRevenue(0)).toBe(0);
    });

    it('should calculate net for monthly revenue', () => {
      // 5,000 EUR - (5000 * 0.0139) = 5000 - 69.50 = 4930.50
      const net = calculateNetRevenue(5000);
      expect(net).toBeCloseTo(4930.50, 2);
    });
  });

  // ========================================================================
  // calculateNetRevenuePerSession - net per session
  // ========================================================================
  describe('calculateNetRevenuePerSession', () => {
    it('should calculate net revenue per session', () => {
      // 85 EUR price, net = 85 - 1.1815 = 83.8185
      const netPerSession = calculateNetRevenuePerSession(85);
      expect(netPerSession).toBeCloseTo(83.82, 2);
    });

    it('should handle different price points', () => {
      expect(calculateNetRevenuePerSession(100)).toBeCloseTo(98.61, 2);
      expect(calculateNetRevenuePerSession(120)).toBeCloseTo(118.33, 2);
      expect(calculateNetRevenuePerSession(75)).toBeCloseTo(73.96, 2);
    });

    it('should return 0 for zero price', () => {
      expect(calculateNetRevenuePerSession(0)).toBe(0);
    });
  });

  // ========================================================================
  // calculateBreakEvenSessionsWithFees - sessions needed to break even
  // ========================================================================
  describe('calculateBreakEvenSessionsWithFees', () => {
    it('should calculate sessions needed to cover fixed costs', () => {
      // Fixed costs: 1000 EUR
      // Net per session: 85 - 1.1815 = 83.8185 EUR
      // Sessions needed: 1000 / 83.8185 = 11.93 -> 12 sessions
      const sessions = calculateBreakEvenSessionsWithFees(1000, 85);
      expect(sessions).toBe(12);
    });

    it('should calculate break-even for higher fixed costs', () => {
      // Fixed costs: 3000 EUR
      // Net per session at 100 EUR: 98.61 EUR
      // Sessions needed: 3000 / 98.61 = 30.42 -> 31 sessions
      const sessions = calculateBreakEvenSessionsWithFees(3000, 100);
      expect(sessions).toBe(31);
    });

    it('should return 0 for zero fixed costs', () => {
      expect(calculateBreakEvenSessionsWithFees(0, 85)).toBe(0);
    });

    it('should handle edge case of very low price per session', () => {
      // Very low price: 10 EUR
      // Net per session: 10 - 0.139 = 9.861 EUR
      // Sessions needed: 100 / 9.861 = 10.14 -> 11 sessions
      const sessions = calculateBreakEvenSessionsWithFees(100, 10);
      expect(sessions).toBe(11);
    });

    it('should always round up to whole session', () => {
      // Exact calculation may yield fractional sessions
      // Should always round up since you cannot have partial sessions
      const sessions = calculateBreakEvenSessionsWithFees(100, 85);
      expect(Number.isInteger(sessions)).toBe(true);
    });
  });

  // ========================================================================
  // calculateMonthlyProfit - Monthly Profit Calculation
  // ========================================================================
  describe('calculateMonthlyProfit', () => {
    it('should calculate monthly profit correctly', () => {
      // Gross: 5000 EUR
      // Payment Fee: 5000 * 0.0139 = 69.50 EUR
      // Net: 5000 - 69.50 = 4930.50 EUR
      // Fixed Costs: 2000 EUR
      // Profit: 4930.50 - 2000 = 2930.50 EUR
      const profit = calculateMonthlyProfit(5000, 2000);
      expect(profit).toBeCloseTo(2930.50, 2);
    });

    it('should return negative profit when costs exceed revenue', () => {
      // Gross: 1000 EUR
      // Payment Fee: 1000 * 0.0139 = 13.90 EUR
      // Net: 1000 - 13.90 = 986.10 EUR
      // Fixed Costs: 2000 EUR
      // Profit: 986.10 - 2000 = -1013.90 EUR
      const profit = calculateMonthlyProfit(1000, 2000);
      expect(profit).toBeCloseTo(-1013.90, 2);
    });

    it('should handle zero gross revenue', () => {
      const profit = calculateMonthlyProfit(0, 2000);
      expect(profit).toBe(-2000);
    });

    it('should handle zero fixed costs', () => {
      // Gross: 5000 EUR
      // Net after fees: 4930.50 EUR
      // No fixed costs
      const profit = calculateMonthlyProfit(5000, 0);
      expect(profit).toBeCloseTo(4930.50, 2);
    });
  });

  // ========================================================================
  // projectMonthGrossRevenue - Growth Projection
  // ========================================================================
  describe('projectMonthGrossRevenue', () => {
    it('should project revenue for month 1 (no growth yet)', () => {
      // Month 1: starting revenue (no compounding)
      const revenue = projectMonthGrossRevenue(5000, 0.05, 1);
      expect(revenue).toBe(5000);
    });

    it('should project revenue with 5% monthly growth', () => {
      // Month 2: 5000 * 1.05 = 5250 EUR
      const month2 = projectMonthGrossRevenue(5000, 0.05, 2);
      expect(month2).toBeCloseTo(5250, 2);

      // Month 3: 5000 * 1.05^2 = 5512.50 EUR
      const month3 = projectMonthGrossRevenue(5000, 0.05, 3);
      expect(month3).toBeCloseTo(5512.50, 2);
    });

    it('should handle 12-month projection', () => {
      // Month 12: 5000 * 1.05^11 = 8551.70 EUR (approximately)
      const month12 = projectMonthGrossRevenue(5000, 0.05, 12);
      expect(month12).toBeCloseTo(8551.70, 0);
    });

    it('should handle zero growth rate', () => {
      const revenue = projectMonthGrossRevenue(5000, 0, 6);
      expect(revenue).toBe(5000);
    });

    it('should handle negative growth rate', () => {
      // Month 3: 5000 * 0.95^2 = 4512.50 EUR
      const month3 = projectMonthGrossRevenue(5000, -0.05, 3);
      expect(month3).toBeCloseTo(4512.50, 2);
    });
  });

  // ========================================================================
  // calculateCumulativeProfit - Growth Projection with Fees
  // ========================================================================
  describe('calculateCumulativeProfit', () => {
    it('should calculate cumulative profit over multiple months', () => {
      // Starting gross: 5000 EUR
      // Growth rate: 5%
      // Fixed costs: 2000 EUR
      //
      // Month 1: Net = 4930.50, Profit = 2930.50
      // Month 2: Gross = 5250, Net = 5177.03, Profit = 3177.03
      // Month 3: Gross = 5512.50, Net = 5435.88, Profit = 3435.88
      const cumulative = calculateCumulativeProfit(5000, 0.05, 2000, 3);

      // Sum of profits for 3 months
      expect(cumulative).toBeGreaterThan(9000);
      expect(cumulative).toBeLessThan(10000);
    });

    it('should handle single month', () => {
      const cumulative = calculateCumulativeProfit(5000, 0.05, 2000, 1);
      expect(cumulative).toBeCloseTo(2930.50, 2);
    });

    it('should handle loss scenario', () => {
      // When fixed costs exceed net revenue
      const cumulative = calculateCumulativeProfit(1000, 0.05, 2000, 3);
      expect(cumulative).toBeLessThan(0);
    });
  });

  // ========================================================================
  // findBreakEvenMonth - When cumulative profit turns positive
  // ========================================================================
  describe('findBreakEvenMonth', () => {
    it('should find break-even month with initial investment', () => {
      // Initial investment: 10000 EUR (negative starting)
      // Monthly profit starting: ~2930.50 EUR
      // Growth rate: 5%
      // Should break even around month 3-4
      const breakEvenMonth = findBreakEvenMonth(10000, 5000, 0.05, 2000);
      expect(breakEvenMonth).toBeGreaterThanOrEqual(3);
      expect(breakEvenMonth).toBeLessThanOrEqual(5);
    });

    it('should return 1 if already profitable from start', () => {
      // No initial investment, already profitable
      const breakEvenMonth = findBreakEvenMonth(0, 5000, 0.05, 2000);
      expect(breakEvenMonth).toBe(1);
    });

    it('should return null if break-even not reached within max months', () => {
      // Very high initial investment, low revenue
      const breakEvenMonth = findBreakEvenMonth(1000000, 1000, 0.01, 2000, 24);
      expect(breakEvenMonth).toBeNull();
    });

    it('should handle zero growth rate', () => {
      // No growth, but still profitable each month
      const breakEvenMonth = findBreakEvenMonth(5000, 5000, 0, 2000);
      expect(breakEvenMonth).toBeGreaterThanOrEqual(2);
      expect(breakEvenMonth).toBeLessThanOrEqual(3);
    });
  });

  // ========================================================================
  // Integration Tests - Real-world scenarios
  // ========================================================================
  describe('Integration: Real-world Scenarios', () => {
    it('should calculate annual impact of fees for therapy practice', () => {
      // Annual gross revenue: 60,000 EUR
      // Annual fees: 60,000 * 0.0139 = 834 EUR
      const annualGross = 60000;
      const annualFee = calculatePaymentFee(annualGross);
      const annualNet = calculateNetRevenue(annualGross);

      expect(annualFee).toBeCloseTo(834, 0);
      expect(annualNet).toBeCloseTo(59166, 0);
    });

    it('should model 12-month growth projection with fees', () => {
      const startingMonthlyGross = 5000;
      const monthlyGrowthRate = 0.05;
      const monthlyFixedCosts = 2000;

      let totalFees = 0;
      let totalNet = 0;
      let totalProfit = 0;

      for (let month = 1; month <= 12; month++) {
        const monthGross = projectMonthGrossRevenue(startingMonthlyGross, monthlyGrowthRate, month);
        const monthFee = calculatePaymentFee(monthGross);
        const monthNet = calculateNetRevenue(monthGross);
        const monthProfit = monthNet - monthlyFixedCosts;

        totalFees += monthFee;
        totalNet += monthNet;
        totalProfit += monthProfit;
      }

      // Total gross over 12 months with 5% growth: ~79,586 EUR
      // Total fees: ~1,106 EUR
      // Total net: ~78,480 EUR
      // Total profit (after 2000/month fixed): ~54,480 EUR
      expect(totalFees).toBeGreaterThan(1000);
      expect(totalFees).toBeLessThan(1200);
      expect(totalProfit).toBeGreaterThan(50000);
    });

    it('should compare break-even with and without payment fees', () => {
      const fixedCosts = 8500;  // Exact multiple of 85 to show fee impact clearly
      const pricePerSession = 85;

      // Without fees: 8500 / 85 = exactly 100 sessions
      const sessionsWithoutFees = Math.ceil(fixedCosts / pricePerSession);
      expect(sessionsWithoutFees).toBe(100);

      // With fees: 8500 / 83.8185 = 101.41 -> 102 sessions
      const sessionsWithFees = calculateBreakEvenSessionsWithFees(fixedCosts, pricePerSession);

      // Fees should require more sessions
      expect(sessionsWithFees).toBeGreaterThan(sessionsWithoutFees);

      // The difference should be small (1-3 sessions typically)
      expect(sessionsWithFees - sessionsWithoutFees).toBeLessThanOrEqual(3);
    });
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================
  describe('Edge Cases', () => {
    it('should handle very small amounts', () => {
      const fee = calculatePaymentFee(0.01);
      expect(fee).toBeCloseTo(0.00014, 5);
    });

    it('should handle very large amounts', () => {
      const fee = calculatePaymentFee(1000000);
      expect(fee).toBe(13900);
    });

    it('should maintain precision for financial calculations', () => {
      // Ensure no floating point errors accumulate
      const gross = 85.99;
      const fee = calculatePaymentFee(gross);
      const net = calculateNetRevenue(gross);

      // Fee + net should equal gross
      expect(fee + net).toBeCloseTo(gross, 10);
    });
  });
});
