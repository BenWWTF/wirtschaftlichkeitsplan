# SumUp Payment Processing Fee Integration Design

**Date:** 2025-11-22
**Status:** Approved for Implementation
**Author:** Claude Code

## Overview

Integrate SumUp payment processing fees (1.39%) into the Wirtschaftlichkeitsplan calculations. The fee will be treated as a cost that reduces net revenue per session, affecting profitability, break-even analysis, and financial projections.

## Requirements

- **Fee Application:** Per-session basis (every payment incurs 1.39%)
- **Treatment:** Deducted from revenue (not price increase)
- **Configuration:** Global setting in practice settings (future-proof for fee changes)
- **Display:** Fully transparent - show gross amount, fee amount, and net amount separately
- **Scope:** All financial calculations must reflect net revenue after fees

## Design

### 1. Database Schema Change

**Table:** `practice_settings`

**New Column:**
```sql
payment_processing_fee_percentage NUMERIC
  NOT NULL
  DEFAULT 1.39
  CHECK (payment_processing_fee_percentage >= 0 AND payment_processing_fee_percentage <= 100)
```

**Migration Strategy:**
- Add column with default 1.39%
- Existing practice settings automatically get 1.39%
- Column is editable in practice settings UI

### 2. Core Calculation Model

For any therapy session with `price_per_session`:

```
Gross Amount = price_per_session
Processing Fee = Gross Amount × (payment_processing_fee_percentage / 100)
Net Amount = Gross Amount - Processing Fee
```

**Example (Psychotherapeutische Medizin):**
```
Gross: 180.00€
Fee (1.39%): 2.50€
Net: 177.50€
```

### 3. Affected Business Logic

#### A. Single Therapy Type Revenue

**Current Calculation (broken):**
```
Monthly Revenue = planned_sessions × price_per_session
Monthly Profit = Monthly Revenue - Monthly Fixed Costs - Variable Costs
```

**New Calculation (corrected):**
```
Gross Revenue = planned_sessions × price_per_session
Processing Fees = Gross Revenue × (fee_percentage / 100)
Net Revenue = Gross Revenue - Processing Fees
Monthly Profit = Net Revenue - Monthly Fixed Costs - (planned_sessions × variable_cost_per_session)
```

#### B. Break-Even Analysis

**Break-even point must use NET revenue:**

```
Fixed Costs + Variable Cost Buffer = N × Net Revenue per Session
Where N = sessions needed to break even

N = Fixed Costs / (Net Revenue per Session - Variable Cost per Session)
```

**Important:** The denominator uses:
- Numerator: `Net Revenue per Session` (after 1.39% fee)
- Numerator: `Variable Cost per Session` (unchanged, already a cost)

#### C. Monthly Planning View

For each therapy type:
```
Gross Revenue: planned_sessions × price_per_session
Processing Fees: Gross Revenue × (fee_percentage / 100)
Net Revenue: Gross Revenue - Processing Fees
Profit Contribution: Net Revenue - (planned_sessions × variable_cost_per_session)
```

**Display to user:**
- Show all three values (gross, fees, net) for transparency
- Use net revenue for profit calculations

#### D. Dashboard Summary

**Overall Monthly Profit Calculation:**
```
Total Gross Revenue = Σ(all therapy types: planned_sessions × price_per_session)
Total Processing Fees = Total Gross Revenue × (fee_percentage / 100)
Total Net Revenue = Total Gross Revenue - Total Processing Fees
Total Variable Costs = Σ(all therapy types: planned_sessions × variable_cost_per_session)
Monthly Profit = Total Net Revenue - Fixed Costs - Total Variable Costs
```

#### E. Growth Projection

If `expected_growth_rate` is X% per month:

**Month N calculation:**
```
Month N Gross Revenue = Month 1 Gross Revenue × (1 + growth_rate)^(N-1)
Month N Processing Fees = Month N Gross Revenue × (fee_percentage / 100)
Month N Net Revenue = Month N Gross Revenue - Month N Processing Fees
```

The growth rate applies to gross revenue; fees scale automatically.

#### F. Break-Even Projection Timeline

**Find Month N where cumulative profit ≥ 0:**

```
Cumulative Profit = Σ(months 1 to N: Monthly Net Revenue - Fixed Costs - Variable Costs)
```

Use **net revenue** (after fees) in this sum.

### 4. Implementation Checklist

**Database:**
- [ ] Create migration to add `payment_processing_fee_percentage` column
- [ ] Update `practice_settings` table schema

**API/Backend:**
- [ ] Update `practice_settings` service to read/write fee percentage
- [ ] Create utility function: `calculateNetRevenue(grossAmount, feePercentage)`
- [ ] Create utility function: `calculateBreakEvenSessions(fixedCosts, netRevenuePerSession, variableCostPerSession)`
- [ ] Update all revenue/profit calculation functions to use net amounts

**Frontend - UI Updates:**
- [ ] Add fee percentage input field in Practice Settings page
- [ ] Update Planung page to display fee information (gross, fee, net)
- [ ] Update Dashboard to show transparent fee breakdown
- [ ] Update Break-even visualization to reflect corrected calculation

**Testing:**
- [ ] Unit tests for fee calculation function
- [ ] Integration tests for all financial calculations with fees
- [ ] Test with various fee percentages (verify it's configurable)
- [ ] Test break-even calculation with different cost structures

### 5. Data Consistency Rules

1. **Never use gross revenue for profit calculations** - Always subtract fees first
2. **Fee percentage must be applied uniformly** - Except where user explicitly overrides (future feature)
3. **Historical data:** Assume all existing sessions used 1.39% fee for reporting
4. **Rounding:** Use standard currency rounding (2 decimal places)

### 6. Display Patterns

**In Monthly Planning View:**
```
Therapieart: Psychotherapeutische Medizin
Geplante Sitzungen: 12
Bruttobetrag pro Sitzung: €180.00
Payment-Gebühr (1.39%): €2.50
Nettobetrag pro Sitzung: €177.50
Monatliche Bruttoeinnahmen: €2,160.00
Monatliche Gebühren: €30.00
Monatliche Nettoeinnahmen: €2,130.00
```

**In Dashboard Summary:**
```
Monatliche Einnahmen (Brutto): €X,XXX.xx
Payment-Gebühren: €XXX.xx
Monatliche Einnahmen (Netto): €X,XXX.xx
Fixkosten: €X,XXX.xx
Variable Kosten: €XXX.xx
Gewinn: €X,XXX.xx
```

### 7. Future Extensibility

- Column is `payment_processing_fee_percentage` (not hardcoded)
- Makes it easy to support different payment methods later
- Can extend to per-therapy-type fees if needed (future feature)

## Validation

- Fee percentage: 0-100% range with database check
- Revenue calculations: Must handle floating point precision
- Break-even: Edge cases (zero profit, immediate break-even, never breaks even)

## Success Criteria

- [x] Design approved by user
- [ ] All calculations reviewed for accuracy
- [ ] Database migration runs successfully
- [ ] All financial views show correct net amounts
- [ ] Break-even calculation is mathematically correct with fees
- [ ] Unit tests pass with 100% fee-related code coverage
