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

  // ========================================================================
  // Edge Cases - Break-Even with Multiple Therapy Types
  // ========================================================================
  describe('Edge Cases - Break-Even with Multiple Therapy Types', () => {
    /**
     * Test aggregated break-even calculation for practices with multiple
     * therapy types at different price points.
     */
    it('should calculate aggregated break-even for multiple therapy types', () => {
      // Practice offers multiple therapy types:
      // - Individual therapy: 85 EUR, 20 sessions/month
      // - Couples therapy: 120 EUR, 10 sessions/month
      // - Group therapy: 45 EUR, 15 sessions/month
      const therapyTypes = [
        { price: 85, sessions: 20 },
        { price: 120, sessions: 10 },
        { price: 45, sessions: 15 },
      ];

      // Calculate total gross revenue
      const totalGross = therapyTypes.reduce(
        (sum, t) => sum + t.price * t.sessions,
        0
      );
      // 85*20 + 120*10 + 45*15 = 1700 + 1200 + 675 = 3575 EUR

      expect(totalGross).toBe(3575);

      // Calculate total net after fees
      const totalNet = calculateNetRevenue(totalGross);
      // 3575 - (3575 * 0.0139) = 3575 - 49.6925 = 3525.31
      expect(totalNet).toBeCloseTo(3525.31, 2);

      // Fixed costs: 2500 EUR
      const fixedCosts = 2500;
      const monthlyProfit = totalNet - fixedCosts;
      expect(monthlyProfit).toBeCloseTo(1025.31, 2);

      // For initial investment recovery
      const initialInvestment = 5000;
      const monthsToBreakEven = Math.ceil(initialInvestment / monthlyProfit);
      expect(monthsToBreakEven).toBe(5); // ~4.88 months, rounds to 5
    });

    /**
     * Test zero margin scenario where the practice never breaks even.
     * This happens when fixed costs equal or exceed net revenue.
     */
    it('should handle zero margin per session (never breaks even)', () => {
      // Price per session: 20 EUR
      // Net per session: 20 - 0.278 = 19.722 EUR
      // Fixed costs per session equivalent: 20 EUR
      // This means each session has a loss after fees
      const pricePerSession = 20;
      const netPerSession = calculateNetRevenuePerSession(pricePerSession);
      expect(netPerSession).toBeCloseTo(19.72, 2);

      // If fixed costs equal gross revenue, there's already a loss
      const fixedCosts = 2000;
      const sessionsNeeded = 100; // 100 * 20 = 2000 EUR gross
      const grossRevenue = pricePerSession * sessionsNeeded;
      const netRevenue = calculateNetRevenue(grossRevenue);
      const profit = netRevenue - fixedCosts;

      // Net: 2000 - 27.80 = 1972.20 EUR
      // Profit: 1972.20 - 2000 = -27.80 EUR (loss)
      expect(profit).toBeCloseTo(-27.80, 2);
      expect(profit).toBeLessThan(0);
    });

    /**
     * Test finding break-even month with growth projection.
     * Demonstrates that growth can eventually overcome initial losses.
     */
    it('should find break-even month in projection with growth', () => {
      // Starting scenario: barely profitable
      const startingGross = 3000; // 3000 EUR/month
      const fixedCosts = 2900; // High fixed costs
      const growthRate = 0.08; // 8% monthly growth
      const initialInvestment = 2000;

      // Month 1: Net = 3000 - 41.70 = 2958.30, Profit = 58.30
      const month1Profit = calculateMonthlyProfit(startingGross, fixedCosts);
      expect(month1Profit).toBeCloseTo(58.30, 2);

      // Find when cumulative profit covers initial investment
      const breakEvenMonth = findBreakEvenMonth(
        initialInvestment,
        startingGross,
        growthRate,
        fixedCosts
      );

      // With 8% growth and small monthly profit, should break even
      expect(breakEvenMonth).not.toBeNull();
      expect(breakEvenMonth).toBeGreaterThanOrEqual(5);
      expect(breakEvenMonth).toBeLessThanOrEqual(20);
    });

    /**
     * Test growth projection aggregated across multiple therapy types.
     * Each therapy type may grow at different rates.
     */
    it('should project growth with multiple therapy types', () => {
      // Different therapy types with different growth rates
      const therapyTypes = [
        { price: 85, startingSessions: 15, growthRate: 0.05 },
        { price: 120, startingSessions: 8, growthRate: 0.10 },
        { price: 45, startingSessions: 20, growthRate: 0.02 },
      ];

      // Calculate 6-month projection
      const months = 6;
      let totalNet = 0;

      for (let month = 1; month <= months; month++) {
        let monthGross = 0;
        for (const therapy of therapyTypes) {
          // Apply growth to sessions (compound growth)
          const sessions = therapy.startingSessions * Math.pow(1 + therapy.growthRate, month - 1);
          monthGross += therapy.price * sessions;
        }
        totalNet += calculateNetRevenue(monthGross);
      }

      // Month 1 gross: 85*15 + 120*8 + 45*20 = 1275 + 960 + 900 = 3135
      // Should show significant growth over 6 months
      expect(totalNet).toBeGreaterThan(18000); // Rough estimate
      expect(totalNet).toBeLessThan(25000);
    });

    /**
     * Test break-even with very high fixed costs.
     * Ensures the function handles extreme values correctly.
     */
    it('should handle break-even with very high fixed costs', () => {
      const veryHighFixedCosts = 50000; // 50,000 EUR fixed costs
      const pricePerSession = 100;

      // Net per session: 100 - 1.39 = 98.61 EUR
      const netPerSession = calculateNetRevenuePerSession(pricePerSession);
      expect(netPerSession).toBeCloseTo(98.61, 2);

      // Sessions needed: 50000 / 98.61 = 507.04 -> 508 sessions
      const sessionsNeeded = calculateBreakEvenSessionsWithFees(
        veryHighFixedCosts,
        pricePerSession
      );
      expect(sessionsNeeded).toBe(508);

      // Verify: 508 * 98.61 = 50,093.88 EUR (covers 50,000)
      const totalNet = netPerSession * sessionsNeeded;
      expect(totalNet).toBeGreaterThanOrEqual(veryHighFixedCosts);
    });

    /**
     * Test break-even with very low session price.
     * The fee percentage has more impact on low-priced sessions.
     */
    it('should handle break-even with very low session price', () => {
      const fixedCosts = 500;
      const veryLowPrice = 15; // Very low session price

      // Net per session: 15 - 0.2085 = 14.79 EUR
      const netPerSession = calculateNetRevenuePerSession(veryLowPrice);
      expect(netPerSession).toBeCloseTo(14.79, 2);

      // Sessions needed: 500 / 14.79 = 33.81 -> 34 sessions
      const sessionsNeeded = calculateBreakEvenSessionsWithFees(
        fixedCosts,
        veryLowPrice
      );
      expect(sessionsNeeded).toBe(34);

      // Compare with no-fee calculation: 500 / 15 = 33.33 -> 34 sessions
      // Fee impact is minimal at this scale but still present
      const sessionsWithoutFees = Math.ceil(fixedCosts / veryLowPrice);
      expect(sessionsNeeded).toBeGreaterThanOrEqual(sessionsWithoutFees);
    });

    /**
     * Test negative margin scenario (loss per session).
     * This can happen when variable costs exceed session price.
     */
    it('should handle negative margin (loss per session)', () => {
      // Scenario: Each session costs more in variable costs than it earns
      // Price: 50 EUR, Variable cost per session: 60 EUR
      const pricePerSession = 50;
      const variableCostPerSession = 60;

      // Net revenue per session after payment fees
      const netPerSession = calculateNetRevenuePerSession(pricePerSession);
      // 50 - 0.695 = 49.305 EUR

      // Margin per session (net - variable costs)
      const marginPerSession = netPerSession - variableCostPerSession;
      // 49.305 - 60 = -10.695 EUR (loss per session!)
      expect(marginPerSession).toBeLessThan(0);
      expect(marginPerSession).toBeCloseTo(-10.695, 2);

      // With negative margin, more sessions = more losses
      const sessions = 10;
      const grossRevenue = pricePerSession * sessions;
      const netRevenue = calculateNetRevenue(grossRevenue);
      const totalVariableCosts = variableCostPerSession * sessions;
      const profit = netRevenue - totalVariableCosts;

      // Net: 500 - 6.95 = 493.05 EUR
      // Variable costs: 600 EUR
      // Loss: 493.05 - 600 = -106.95 EUR
      expect(profit).toBeCloseTo(-106.95, 2);
    });

    /**
     * Test that break-even returns Infinity for zero price.
     */
    it('should return Infinity for zero price per session', () => {
      const sessionsNeeded = calculateBreakEvenSessionsWithFees(1000, 0);
      expect(sessionsNeeded).toBe(Infinity);
    });

    /**
     * Test cumulative profit with consistently negative monthly profit.
     * Ensures the projection correctly accumulates losses.
     */
    it('should calculate cumulative loss when consistently unprofitable', () => {
      // Scenario: Fixed costs always exceed net revenue
      const startingGross = 1000; // Low revenue
      const fixedCosts = 2000; // High fixed costs
      const growthRate = 0.03; // 3% growth (not enough to catch up)
      const months = 6;

      const cumulativeProfit = calculateCumulativeProfit(
        startingGross,
        growthRate,
        fixedCosts,
        months
      );

      // Each month has significant loss
      // Month 1: Net = 986.10, Profit = -1013.90
      // Should accumulate losses over 6 months
      expect(cumulativeProfit).toBeLessThan(0);
      expect(cumulativeProfit).toBeLessThan(-5000); // Significant accumulated loss
    });

    /**
     * Test break-even never reached with insufficient revenue.
     */
    it('should return null when break-even is never reached', () => {
      // Very high initial investment, perpetually unprofitable
      const breakEvenMonth = findBreakEvenMonth(
        100000, // 100k investment
        1000, // 1000 EUR/month gross
        0.01, // 1% growth
        2000, // 2000 EUR fixed costs (always losing money)
        36 // Search up to 36 months
      );

      expect(breakEvenMonth).toBeNull();
    });

    /**
     * Test weighted average break-even for blended session prices.
     */
    it('should calculate weighted average break-even for blended prices', () => {
      // Practice mix:
      // - 60% of sessions at 80 EUR
      // - 30% of sessions at 100 EUR
      // - 10% of sessions at 150 EUR
      const weightedAveragePrice = 0.6 * 80 + 0.3 * 100 + 0.1 * 150;
      // = 48 + 30 + 15 = 93 EUR average

      expect(weightedAveragePrice).toBe(93);

      const fixedCosts = 3000;
      const sessionsNeeded = calculateBreakEvenSessionsWithFees(
        fixedCosts,
        weightedAveragePrice
      );

      // Net per session: 93 - 1.2927 = 91.71 EUR
      // Sessions: 3000 / 91.71 = 32.71 -> 33 sessions
      expect(sessionsNeeded).toBe(33);
    });
  });
});
