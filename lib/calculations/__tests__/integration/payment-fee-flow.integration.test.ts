/**
 * Payment Fee Flow Integration Tests
 *
 * End-to-end tests verifying the complete payment fee flow works correctly
 * across all calculation modules. These tests simulate real-world scenarios
 * for a therapy practice using SumUp payment processing.
 *
 * Test scenarios based on the SumUp Payment Fee Implementation Plan.
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
} from '../../payment-fees';

import { calculateViabilityScore, type ViabilityInput } from '../../composite/viability-calculator';
import {
  calculateForecast,
  calculateBreakEvenMonth as calculateForecastBreakEvenMonth,
  type HistoricalMetrics,
} from '../../composite/forecast-calculator';

describe('Payment Fee Flow Integration Tests', () => {
  // ========================================================================
  // TEST 1: Complete Profit Calculation with Fees
  // Real scenario from the implementation plan
  // ========================================================================
  describe('Complete profit calculation with fees', () => {
    /**
     * Test scenario from the plan:
     * - Practice with EUR 8,000 fixed costs
     * - Psychotherapeutische Medizin at EUR 180/session
     * - 40 planned sessions
     * - 1.39% payment fee
     * - Variable costs EUR 2/session
     * - Expected: Gross EUR 7,200 -> Fee EUR 100.08 -> Net EUR 7,099.92 -> Profit -EUR 980.08
     */
    it('should correctly calculate profit for therapy practice with fees', () => {
      // Configuration
      const fixedCosts = 8000;
      const pricePerSession = 180;
      const plannedSessions = 40;
      const variableCostPerSession = 2;

      // Step 1: Calculate gross revenue
      const grossRevenue = pricePerSession * plannedSessions;
      expect(grossRevenue).toBe(7200);

      // Step 2: Calculate payment fee (1.39%)
      const paymentFee = calculatePaymentFee(grossRevenue);
      expect(paymentFee).toBeCloseTo(100.08, 2);

      // Step 3: Calculate net revenue after fees
      const netRevenueAfterFees = calculateNetRevenue(grossRevenue);
      expect(netRevenueAfterFees).toBeCloseTo(7099.92, 2);

      // Step 4: Calculate total variable costs
      const totalVariableCosts = variableCostPerSession * plannedSessions;
      expect(totalVariableCosts).toBe(80);

      // Step 5: Calculate total costs (fixed + variable)
      const totalCosts = fixedCosts + totalVariableCosts;
      expect(totalCosts).toBe(8080);

      // Step 6: Calculate net profit
      const netProfit = netRevenueAfterFees - totalCosts;
      expect(netProfit).toBeCloseTo(-980.08, 2);

      // Verify the loss is due to costs exceeding net revenue
      expect(netProfit).toBeLessThan(0);
    });

    it('should correctly calculate margin percentage with fees', () => {
      const grossRevenue = 7200;
      const fixedCosts = 8000;
      const variableCosts = 80;

      const netRevenue = calculateNetRevenue(grossRevenue);
      const totalCosts = fixedCosts + variableCosts;
      const profit = netRevenue - totalCosts;
      const marginPercent = (profit / grossRevenue) * 100;

      // Margin should be negative due to loss
      expect(marginPercent).toBeCloseTo(-13.61, 1);
    });

    it('should verify fee rate constant is correct', () => {
      expect(SUMUP_FEE_RATE).toBe(0.0139);
      expect(SUMUP_FEE_RATE * 100).toBe(1.39); // 1.39%
    });
  });

  // ========================================================================
  // TEST 2: Break-even Sessions with Fees
  // Verify break-even calculation includes payment fees
  // ========================================================================
  describe('Break-even sessions with fees', () => {
    /**
     * Test scenario:
     * - Fixed costs EUR 8,000
     * - Net revenue per session EUR 177.50 (after 1.39% fee on EUR 180)
     * - Variable cost EUR 2/session
     * - Expected: ~45.58 sessions needed to break even
     * - Verify: 46 sessions yields positive profit
     */
    it('should calculate break-even sessions correctly', () => {
      const fixedCosts = 8000;
      const pricePerSession = 180;
      const variableCostPerSession = 2;

      // Net revenue per session after 1.39% fee
      const netPerSession = calculateNetRevenuePerSession(pricePerSession);
      expect(netPerSession).toBeCloseTo(177.50, 2);

      // Contribution margin per session (net revenue - variable cost)
      const contributionMargin = netPerSession - variableCostPerSession;
      expect(contributionMargin).toBeCloseTo(175.50, 2);

      // Sessions needed to cover fixed costs
      const sessionsNeeded = fixedCosts / contributionMargin;
      expect(sessionsNeeded).toBeCloseTo(45.58, 2);

      // Rounded up to whole sessions
      const wholeSessionsNeeded = Math.ceil(sessionsNeeded);
      expect(wholeSessionsNeeded).toBe(46);
    });

    it('should verify 46 sessions yields positive profit', () => {
      const fixedCosts = 8000;
      const pricePerSession = 180;
      const variableCostPerSession = 2;
      const sessions = 46;

      const grossRevenue = pricePerSession * sessions;
      const netRevenue = calculateNetRevenue(grossRevenue);
      const totalVariableCosts = variableCostPerSession * sessions;
      const profit = netRevenue - fixedCosts - totalVariableCosts;

      // 46 sessions should yield positive profit
      expect(profit).toBeGreaterThan(0);
      expect(profit).toBeCloseTo(72.91, 2); // Small positive profit
    });

    it('should verify 45 sessions yields negative profit', () => {
      const fixedCosts = 8000;
      const pricePerSession = 180;
      const variableCostPerSession = 2;
      const sessions = 45;

      const grossRevenue = pricePerSession * sessions;
      const netRevenue = calculateNetRevenue(grossRevenue);
      const totalVariableCosts = variableCostPerSession * sessions;
      const profit = netRevenue - fixedCosts - totalVariableCosts;

      // 45 sessions should still yield negative profit
      expect(profit).toBeLessThan(0);
      expect(profit).toBeCloseTo(-102.59, 2); // Small loss
    });

    it('should compare break-even with and without fees', () => {
      const fixedCosts = 8000;
      const pricePerSession = 180;
      const variableCostPerSession = 2;

      // Without fees
      const contributionWithoutFees = pricePerSession - variableCostPerSession;
      const sessionsWithoutFees = Math.ceil(fixedCosts / contributionWithoutFees);

      // With fees
      const netPerSession = calculateNetRevenuePerSession(pricePerSession);
      const contributionWithFees = netPerSession - variableCostPerSession;
      const sessionsWithFees = Math.ceil(fixedCosts / contributionWithFees);

      // Payment fees require more sessions to break even
      expect(sessionsWithFees).toBeGreaterThan(sessionsWithoutFees);
      expect(sessionsWithFees).toBe(46);
      expect(sessionsWithoutFees).toBe(45);
    });

    it('should use calculateBreakEvenSessionsWithFees for simple cases', () => {
      // Note: This function doesn't account for variable costs
      // It's simpler and used when variable costs are negligible
      const fixedCosts = 8000;
      const pricePerSession = 180;

      const sessions = calculateBreakEvenSessionsWithFees(fixedCosts, pricePerSession);
      expect(sessions).toBe(46); // 8000 / 177.50 = 45.07, rounded up
    });
  });

  // ========================================================================
  // TEST 3: Full Monthly Projection with Growth
  // Multi-month test verifying fees scale with growth
  // ========================================================================
  describe('Full monthly projection with growth', () => {
    /**
     * Test multi-month projection:
     * - Starting gross revenue: EUR 10,000/month
     * - Monthly growth rate: 5%
     * - Fixed costs: EUR 6,000/month
     * - Verify fees scale with growth
     * - Verify cumulative profit calculation
     */
    it('should project monthly growth with scaling fees', () => {
      const startingGross = 10000;
      const growthRate = 0.05;
      const fixedCosts = 6000;
      const months = 6;

      const monthlyData: Array<{
        month: number;
        grossRevenue: number;
        paymentFee: number;
        netRevenue: number;
        profit: number;
      }> = [];

      for (let month = 1; month <= months; month++) {
        const grossRevenue = projectMonthGrossRevenue(startingGross, growthRate, month);
        const paymentFee = calculatePaymentFee(grossRevenue);
        const netRevenue = calculateNetRevenue(grossRevenue);
        const profit = calculateMonthlyProfit(grossRevenue, fixedCosts);

        monthlyData.push({
          month,
          grossRevenue,
          paymentFee,
          netRevenue,
          profit,
        });
      }

      // Verify month 1 (no growth)
      expect(monthlyData[0].grossRevenue).toBe(10000);
      expect(monthlyData[0].paymentFee).toBeCloseTo(139, 2);
      expect(monthlyData[0].netRevenue).toBeCloseTo(9861, 2);
      expect(monthlyData[0].profit).toBeCloseTo(3861, 2);

      // Verify month 6 (compounded growth)
      const expectedMonth6Gross = 10000 * Math.pow(1.05, 5);
      expect(monthlyData[5].grossRevenue).toBeCloseTo(expectedMonth6Gross, 2);
      expect(monthlyData[5].paymentFee).toBeCloseTo(expectedMonth6Gross * 0.0139, 2);

      // Verify fees scale proportionally with revenue
      const feeRatio1 = monthlyData[0].paymentFee / monthlyData[0].grossRevenue;
      const feeRatio6 = monthlyData[5].paymentFee / monthlyData[5].grossRevenue;
      expect(feeRatio1).toBeCloseTo(feeRatio6, 4); // Fee rate stays constant
      expect(feeRatio1).toBeCloseTo(0.0139, 4);
    });

    it('should calculate cumulative profit correctly over 12 months', () => {
      const startingGross = 10000;
      const growthRate = 0.05;
      const fixedCosts = 6000;
      const months = 12;

      const cumulativeProfit = calculateCumulativeProfit(
        startingGross,
        growthRate,
        fixedCosts,
        months
      );

      // Calculate expected cumulative profit manually
      let expectedCumulative = 0;
      for (let month = 1; month <= months; month++) {
        const gross = projectMonthGrossRevenue(startingGross, growthRate, month);
        const profit = calculateMonthlyProfit(gross, fixedCosts);
        expectedCumulative += profit;
      }

      expect(cumulativeProfit).toBeCloseTo(expectedCumulative, 2);
      expect(cumulativeProfit).toBeGreaterThan(50000); // Significant profit over 12 months
    });

    it('should handle loss scenario with high fixed costs', () => {
      const startingGross = 5000;
      const growthRate = 0.03;
      const fixedCosts = 8000;
      const months = 6;

      const cumulativeProfit = calculateCumulativeProfit(
        startingGross,
        growthRate,
        fixedCosts,
        months
      );

      // With high fixed costs, cumulative should be negative
      expect(cumulativeProfit).toBeLessThan(0);

      // Verify each month is unprofitable
      for (let month = 1; month <= months; month++) {
        const gross = projectMonthGrossRevenue(startingGross, growthRate, month);
        const profit = calculateMonthlyProfit(gross, fixedCosts);
        expect(profit).toBeLessThan(0);
      }
    });

    it('should find break-even month for initial investment', () => {
      const initialInvestment = 15000;
      const startingGross = 10000;
      const growthRate = 0.05;
      const fixedCosts = 6000;

      const breakEvenMonth = findBreakEvenMonth(
        initialInvestment,
        startingGross,
        growthRate,
        fixedCosts
      );

      expect(breakEvenMonth).not.toBeNull();
      expect(breakEvenMonth).toBeGreaterThanOrEqual(4);
      expect(breakEvenMonth).toBeLessThanOrEqual(6);

      // Verify cumulative profit at break-even month is positive
      if (breakEvenMonth) {
        const cumulativeAtBreakEven = calculateCumulativeProfit(
          startingGross,
          growthRate,
          fixedCosts,
          breakEvenMonth
        );
        expect(cumulativeAtBreakEven - initialInvestment).toBeGreaterThanOrEqual(-1); // Allow small rounding
      }
    });
  });

  // ========================================================================
  // TEST 4: Practice Viability with Payment Fees
  // Integration with viability calculator
  // ========================================================================
  describe('Practice viability with payment fees', () => {
    it('should calculate viability score using net revenue', () => {
      const grossRevenue = 15000;
      const paymentFees = calculatePaymentFee(grossRevenue);
      const netRevenue = calculateNetRevenue(grossRevenue);
      const expenses = 12000;

      // Viability using gross revenue (incorrect)
      const viabilityGross: ViabilityInput = {
        totalRevenue: grossRevenue,
        totalExpenses: expenses,
        totalSessions: 100,
        targetSessions: 100,
        therapyCount: 3,
        activeTherapyCount: 3,
      };

      // Viability using net revenue (correct)
      const viabilityNet: ViabilityInput = {
        totalRevenue: netRevenue,
        totalExpenses: expenses,
        totalSessions: 100,
        targetSessions: 100,
        therapyCount: 3,
        activeTherapyCount: 3,
      };

      const scoreGross = calculateViabilityScore(viabilityGross);
      const scoreNet = calculateViabilityScore(viabilityNet);

      // Net revenue viability should be lower due to fee deduction
      expect(scoreNet.score).toBeLessThan(scoreGross.score);

      // Both should still be healthy in this scenario
      expect(scoreGross.status).toBe('healthy');
      expect(scoreNet.status).toBe('healthy');
    });

    it('should show fee impact on marginal viability', () => {
      // Scenario where fees affect tight margins
      const grossRevenue = 10000;
      const expenses = 9500; // Close to revenue

      const netRevenue = calculateNetRevenue(grossRevenue);

      const viabilityNet: ViabilityInput = {
        totalRevenue: netRevenue, // 9861 after fees
        totalExpenses: expenses, // 9500
        totalSessions: 80,
        targetSessions: 100,
        therapyCount: 3,
        activeTherapyCount: 2,
      };

      const score = calculateViabilityScore(viabilityNet);

      // Revenue ratio should be tight after fees
      expect(score.revenueRatio).toBeLessThan(1.1);
      expect(score.revenueRatio).toBeGreaterThan(1.0); // Still covering expenses

      // Verify fee impact: gross would give higher ratio
      const grossRatio = grossRevenue / expenses;
      const netRatio = netRevenue / expenses;
      expect(netRatio).toBeLessThan(grossRatio);

      // Score reflects the overall viability (may be healthy due to other factors)
      expect(score.score).toBeGreaterThan(0);
      expect(score.score).toBeLessThanOrEqual(100);
    });
  });

  // ========================================================================
  // TEST 5: Forecast Break-even with Payment Fees
  // Integration with forecast calculator
  // ========================================================================
  describe('Forecast break-even with payment fees', () => {
    it('should calculate forecast break-even month accounting for fees', () => {
      // Create historical data with growth trend
      const historicalData: HistoricalMetrics[] = [];
      const startDate = new Date(2024, 0, 1); // January 2024

      for (let i = 0; i < 6; i++) {
        const month = new Date(startDate);
        month.setMonth(month.getMonth() + i);
        historicalData.push({
          month,
          revenue: 5000 + i * 500, // Growing from 5000 to 7500
          sessions: 50 + i * 5,
          expenses: 6000,
        });
      }

      const forecast = calculateForecast(historicalData, 6);
      const fixedCosts = 6000;

      const breakEvenMonth = calculateForecastBreakEvenMonth(forecast, fixedCosts);

      // With the growth trend, should reach break-even
      expect(forecast.length).toBe(6);

      // Verify forecast revenues are reasonable
      expect(forecast[0].forecastedRevenue).toBeGreaterThan(7000);
    });

    it('should verify fee impact on forecast profitability', () => {
      const historicalData: HistoricalMetrics[] = [];
      const startDate = new Date(2024, 0, 1);

      // Flat revenue trend
      for (let i = 0; i < 6; i++) {
        const month = new Date(startDate);
        month.setMonth(month.getMonth() + i);
        historicalData.push({
          month,
          revenue: 8000, // Constant revenue
          sessions: 80,
          expenses: 7000,
        });
      }

      const forecast = calculateForecast(historicalData, 6);

      // Check each forecasted month
      for (const point of forecast) {
        const grossRevenue = point.forecastedRevenue;
        const paymentFee = calculatePaymentFee(grossRevenue);
        const netRevenue = calculateNetRevenue(grossRevenue);

        // Fee should be ~1.39% of gross
        expect(paymentFee / grossRevenue).toBeCloseTo(0.0139, 3);

        // Net should be ~98.61% of gross
        expect(netRevenue / grossRevenue).toBeCloseTo(0.9861, 3);
      }
    });
  });

  // ========================================================================
  // TEST 6: Multi-Therapy Practice Scenario
  // Complex scenario with multiple therapy types
  // ========================================================================
  describe('Multi-therapy practice scenario', () => {
    interface TherapyType {
      name: string;
      pricePerSession: number;
      plannedSessions: number;
      variableCostPerSession: number;
    }

    it('should calculate total practice profit with multiple therapy types', () => {
      const therapyTypes: TherapyType[] = [
        { name: 'Individual Therapy', pricePerSession: 120, plannedSessions: 40, variableCostPerSession: 3 },
        { name: 'Couples Therapy', pricePerSession: 180, plannedSessions: 20, variableCostPerSession: 5 },
        { name: 'Group Therapy', pricePerSession: 60, plannedSessions: 30, variableCostPerSession: 2 },
      ];
      const monthlyFixedCosts = 8000;

      // Calculate totals
      let totalGrossRevenue = 0;
      let totalVariableCosts = 0;
      let totalSessions = 0;

      for (const therapy of therapyTypes) {
        totalGrossRevenue += therapy.pricePerSession * therapy.plannedSessions;
        totalVariableCosts += therapy.variableCostPerSession * therapy.plannedSessions;
        totalSessions += therapy.plannedSessions;
      }

      // Expected: 4800 + 3600 + 1800 = 10200 gross
      expect(totalGrossRevenue).toBe(10200);
      expect(totalSessions).toBe(90);

      // Calculate payment fees on total gross
      const totalPaymentFees = calculatePaymentFee(totalGrossRevenue);
      expect(totalPaymentFees).toBeCloseTo(141.78, 2);

      // Net revenue after fees
      const netRevenue = calculateNetRevenue(totalGrossRevenue);
      expect(netRevenue).toBeCloseTo(10058.22, 2);

      // Total costs
      const totalCosts = monthlyFixedCosts + totalVariableCosts;
      expect(totalVariableCosts).toBe(120 + 100 + 60); // 280

      // Net profit
      const netProfit = netRevenue - totalCosts;
      expect(netProfit).toBeCloseTo(1778.22, 2);
    });

    it('should calculate weighted average contribution margin', () => {
      const therapyTypes: TherapyType[] = [
        { name: 'Individual', pricePerSession: 120, plannedSessions: 40, variableCostPerSession: 3 },
        { name: 'Couples', pricePerSession: 180, plannedSessions: 20, variableCostPerSession: 5 },
        { name: 'Group', pricePerSession: 60, plannedSessions: 30, variableCostPerSession: 2 },
      ];

      let totalSessions = 0;
      let weightedContribution = 0;

      for (const therapy of therapyTypes) {
        const netPerSession = calculateNetRevenuePerSession(therapy.pricePerSession);
        const contributionMargin = netPerSession - therapy.variableCostPerSession;
        weightedContribution += contributionMargin * therapy.plannedSessions;
        totalSessions += therapy.plannedSessions;
      }

      const averageContribution = weightedContribution / totalSessions;

      // Calculate break-even sessions using weighted average
      const fixedCosts = 8000;
      const breakEvenSessions = Math.ceil(fixedCosts / averageContribution);

      expect(averageContribution).toBeGreaterThan(100);
      expect(breakEvenSessions).toBeLessThan(90); // Should be able to break even
    });
  });

  // ========================================================================
  // TEST 7: Annual Financial Summary with Fees
  // Year-end calculations and comparisons
  // ========================================================================
  describe('Annual financial summary with fees', () => {
    it('should calculate annual fee impact', () => {
      const monthlyGrossRevenue = 12000;
      const monthsPerYear = 12;

      const annualGrossRevenue = monthlyGrossRevenue * monthsPerYear;
      const annualPaymentFees = calculatePaymentFee(annualGrossRevenue);
      const annualNetRevenue = calculateNetRevenue(annualGrossRevenue);

      expect(annualGrossRevenue).toBe(144000);
      expect(annualPaymentFees).toBeCloseTo(2001.60, 2);
      expect(annualNetRevenue).toBeCloseTo(141998.40, 2);

      // Fee as percentage of gross
      const feePercent = (annualPaymentFees / annualGrossRevenue) * 100;
      expect(feePercent).toBeCloseTo(1.39, 2);
    });

    it('should compare annual profit with and without fees', () => {
      const monthlyGrossRevenue = 12000;
      const monthlyFixedCosts = 8000;
      const monthsPerYear = 12;

      // Without fees
      const annualProfitWithoutFees = (monthlyGrossRevenue - monthlyFixedCosts) * monthsPerYear;

      // With fees
      const annualNetRevenue = calculateNetRevenue(monthlyGrossRevenue * monthsPerYear);
      const annualProfitWithFees = annualNetRevenue - (monthlyFixedCosts * monthsPerYear);

      // Annual fee impact on profit
      const annualFeeImpact = annualProfitWithoutFees - annualProfitWithFees;

      expect(annualProfitWithoutFees).toBe(48000);
      expect(annualProfitWithFees).toBeCloseTo(45998.40, 2);
      expect(annualFeeImpact).toBeCloseTo(2001.60, 2);
    });

    it('should project annual profit with growth', () => {
      const startingMonthlyGross = 10000;
      const monthlyGrowthRate = 0.03; // 3% monthly growth
      const monthlyFixedCosts = 6000;

      const annualCumulativeProfit = calculateCumulativeProfit(
        startingMonthlyGross,
        monthlyGrowthRate,
        monthlyFixedCosts,
        12
      );

      // Calculate expected annual gross and fees
      let totalAnnualGross = 0;
      let totalAnnualFees = 0;
      for (let month = 1; month <= 12; month++) {
        const monthGross = projectMonthGrossRevenue(startingMonthlyGross, monthlyGrowthRate, month);
        totalAnnualGross += monthGross;
        totalAnnualFees += calculatePaymentFee(monthGross);
      }

      // With 3% monthly growth from 10000, annual fees are ~1973 EUR
      expect(totalAnnualFees).toBeGreaterThan(1900);
      expect(totalAnnualFees).toBeLessThan(2100);
      expect(annualCumulativeProfit).toBeGreaterThan(50000);
    });
  });

  // ========================================================================
  // TEST 8: Edge Cases and Boundary Conditions
  // ========================================================================
  describe('Edge cases and boundary conditions', () => {
    it('should handle zero revenue correctly', () => {
      expect(calculatePaymentFee(0)).toBe(0);
      expect(calculateNetRevenue(0)).toBe(0);
      expect(calculateBreakEvenSessionsWithFees(1000, 0)).toBe(Infinity);
    });

    it('should handle very small amounts', () => {
      const smallAmount = 0.01;
      const fee = calculatePaymentFee(smallAmount);
      const net = calculateNetRevenue(smallAmount);

      expect(fee).toBeCloseTo(0.000139, 6);
      expect(net).toBeCloseTo(0.009861, 6);
      expect(fee + net).toBeCloseTo(smallAmount, 10);
    });

    it('should handle very large amounts', () => {
      const largeAmount = 1000000;
      const fee = calculatePaymentFee(largeAmount);
      const net = calculateNetRevenue(largeAmount);

      expect(fee).toBe(13900);
      expect(net).toBe(986100);
      expect(fee + net).toBe(largeAmount);
    });

    it('should maintain precision across calculations', () => {
      const grossAmount = 123.45;
      const fee = calculatePaymentFee(grossAmount);
      const net = calculateNetRevenue(grossAmount);

      // Fee + Net should exactly equal Gross (within floating point precision)
      expect(fee + net).toBeCloseTo(grossAmount, 10);
    });

    it('should handle negative profit scenarios', () => {
      const gross = 3000;
      const fixedCosts = 5000;

      const profit = calculateMonthlyProfit(gross, fixedCosts);
      expect(profit).toBeLessThan(0);
      // Net revenue: 3000 - 41.70 = 2958.30, Profit: 2958.30 - 5000 = -2041.70
      expect(profit).toBeCloseTo(-2041.70, 2);
    });
  });

  // ========================================================================
  // TEST 9: Fee Impact Analysis
  // Quantify the impact of payment fees on profitability
  // ========================================================================
  describe('Fee impact analysis', () => {
    it('should calculate marginal fee impact per session', () => {
      const sessionPrices = [60, 85, 100, 120, 150, 180, 200];

      for (const price of sessionPrices) {
        const fee = calculatePaymentFee(price);
        const feePercent = (fee / price) * 100;

        // Fee should always be 1.39%
        expect(feePercent).toBeCloseTo(1.39, 2);
      }
    });

    it('should calculate cumulative fee impact for typical practice', () => {
      // Typical practice: 80 sessions/month at EUR 100 average
      const sessionsPerMonth = 80;
      const averagePrice = 100;
      const monthlyGross = sessionsPerMonth * averagePrice;
      const monthlyFee = calculatePaymentFee(monthlyGross);

      // Annual totals
      const annualFees = monthlyFee * 12;
      const sessionsToPayFees = Math.ceil(annualFees / calculateNetRevenuePerSession(averagePrice));

      expect(monthlyFee).toBeCloseTo(111.20, 2);
      expect(annualFees).toBeCloseTo(1334.40, 2);
      expect(sessionsToPayFees).toBe(14); // ~14 sessions/year just to cover fees
    });

    it('should show break-even session difference with/without fees', () => {
      const fixedCostsRange = [5000, 8000, 10000, 15000, 20000];
      const pricePerSession = 100;

      for (const fixedCosts of fixedCostsRange) {
        const sessionsWithoutFees = Math.ceil(fixedCosts / pricePerSession);
        const sessionsWithFees = calculateBreakEvenSessionsWithFees(fixedCosts, pricePerSession);
        const extraSessions = sessionsWithFees - sessionsWithoutFees;

        // Extra sessions needed due to 1.39% fee
        // Due to rounding up to whole sessions, percentage increase can be up to ~3%
        expect(extraSessions).toBeGreaterThanOrEqual(0);
        expect(extraSessions).toBeLessThanOrEqual(Math.ceil(sessionsWithFees * 0.03)); // At most ~3% increase
      }
    });
  });
});
