# Dashboard & Architecture Restructuring Design
**Date**: November 15, 2025
**Status**: Design Phase
**Author**: Claude Code

## Executive Summary

This design document outlines the restructuring of the Wirtschaftlichkeitsplan dashboard and underlying calculation architecture. The goal is to eliminate overlapping calculations (monthly, annual, therapy metrics) and unify them into a single metrics engine while simultaneously improving UI/UX to make the financial planning tool more intuitive for therapy practice managers.

### Key Objectives
1. **Single Source of Truth**: Replace scattered revenue/margin calculations with unified calculator functions
2. **Time Scope Flexibility**: Support Month/Quarter/Year/All-Time views from single data engine
3. **Comparison Modes**: Enable Plan vs Actual, Period vs Period comparisons seamlessly
4. **Actionable Intelligence**: Surface viability score and variance alerts as core features
5. **Cleaner Code**: Separate concerns: calculators → metrics engine → UI components

---

## Current State Analysis

### Pain Points
- **Overlapping Calculations**: Same revenue formula duplicated across `getMonthlyMetrics()`, `getTherapyMetrics()`, `getDashboardSummary()`
- **Scope Entanglement**: Monthly and annual calculations intertwined; hard to isolate one scope
- **No Variance Detection**: Alerts are computed ad-hoc in components
- **Inconsistent Formatting**: Time periods handled differently across modules
- **UI/UX Fragmentation**: Users navigate separate views instead of unified dashboard

### Current Code Structure
```
lib/actions/dashboard.ts
├── getMonthlyMetrics()        [scope: single month, hard-coded calculations]
├── getMonthlyMetricsRange()   [scope: multi-month, aggregates monthly]
├── getTherapyMetrics()        [scope: therapy type, reuses session logic]
└── getDashboardSummary()      [scope: annual, re-aggregates everything]
```

**Problem**: Each function recalculates revenue independently. Changes to pricing logic require updates in 3+ places.

---

## Proposed Architecture

### Layer 1: Pure Calculation Functions

**Location**: `lib/calculations/`

These are stateless, testable functions that contain all business logic formulas. They take input data and return calculated results.

#### 1.1 Core Calculators (`lib/calculations/core/`)

**`session-calculator.ts`**
```typescript
export function calculateSessionMetrics(
  plannedSessions: number,
  actualSessions: number
) {
  return {
    plannedSessions,
    actualSessions,
    variance: actualSessions - plannedSessions,
    variancePercent: plannedSessions > 0
      ? ((actualSessions - plannedSessions) / plannedSessions) * 100
      : 0,
    utilizationRate: plannedSessions > 0
      ? (actualSessions / plannedSessions) * 100
      : 0
  }
}
```

**`revenue-calculator.ts`**
```typescript
export function calculateSessionRevenue(
  sessions: number,
  pricePerSession: number
) {
  return {
    revenue: sessions * pricePerSession,
    sessions,
    pricePerSession,
    averagePrice: pricePerSession
  }
}

export function calculateMonthRevenue(
  therapyData: Array<{
    sessions: number,
    price: number
  }>
) {
  return therapyData.reduce(
    (sum, t) => sum + (t.sessions * t.price),
    0
  )
}
```

**`margin-calculator.ts`**
```typescript
export function calculateMargin(
  revenue: number,
  variableCost: number,
  fixedCost: number = 0
) {
  const totalCost = variableCost + fixedCost
  const margin = revenue - totalCost
  const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0

  return {
    revenue,
    totalCost,
    margin,
    marginPercent,
    breakEven: revenue >= totalCost
  }
}

export function calculateContributionMargin(
  pricePerSession: number,
  variableCostPerSession: number
) {
  const margin = pricePerSession - variableCostPerSession
  return {
    pricePerSession,
    variableCostPerSession,
    margin,
    marginPercent: (margin / pricePerSession) * 100
  }
}
```

#### 1.2 Composite Calculators (`lib/calculations/composite/`)

**`viability-calculator.ts`** - NEW
```typescript
export function calculateViabilityScore(metrics: {
  totalRevenue: number,
  totalExpenses: number,
  totalSessions: number,
  targetSessions: number,
  therapyCount: number,
  activeTherapyCount: number
}): ViabilityScore {
  // Weighted score from 4 components
  const revenueRatio = metrics.totalRevenue / (metrics.totalExpenses || 1)
  const therapyUtilization = (metrics.activeTherapyCount / metrics.therapyCount) * 100
  const sessionUtilization = (metrics.totalSessions / metrics.targetSessions) * 100
  const expenseManagement = metrics.totalRevenue > 0
    ? ((metrics.totalRevenue - metrics.totalExpenses) / metrics.totalRevenue) * 100
    : 0

  const score =
    (revenueRatio * 40) +           // 40% weight
    (therapyUtilization * 0.3) +    // 30% weight
    (sessionUtilization * 0.2) +    // 20% weight
    ((expenseManagement + 100) * 0.1) // 10% weight (shifted to positive)

  return {
    score: Math.min(100, Math.max(0, score)),
    revenueRatio,
    therapyUtilization,
    sessionUtilization,
    expenseManagement,
    status: score < 40 ? 'critical' : score < 70 ? 'caution' : 'healthy'
  }
}
```

**`variance-detector.ts`** - NEW
```typescript
export type VarianceAlert = {
  id: string
  type: 'REVENUE_BELOW_PLAN' | 'REVENUE_ABOVE_PLAN' | 'THERAPY_UNDERUTILIZED'
       | 'THERAPY_OPPORTUNITY' | 'EXPENSE_OVERRUN' | 'MARGIN_DECLINING'
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  metric: string
  currentValue: number
  expectedValue: number
  variance: number
  variancePercent: number
  actionItems: string[]
}

export function detectVariances(
  actual: MetricsData,
  plan: MetricsData
): VarianceAlert[] {
  const alerts: VarianceAlert[] = []

  // Revenue variance detection
  const revenueVariance = actual.totalRevenue - plan.totalRevenue
  const revenueVariancePercent = plan.totalRevenue > 0
    ? (revenueVariance / plan.totalRevenue) * 100
    : 0

  if (revenueVariancePercent < -15) {
    alerts.push({
      id: 'revenue-below-plan',
      type: 'REVENUE_BELOW_PLAN',
      severity: 'critical',
      title: 'Revenue 15%+ Below Plan',
      message: `Expected €${plan.totalRevenue.toFixed(2)}, got €${actual.totalRevenue.toFixed(2)}`,
      metric: 'total_revenue',
      currentValue: actual.totalRevenue,
      expectedValue: plan.totalRevenue,
      variance: revenueVariance,
      variancePercent: revenueVariancePercent,
      actionItems: [
        'Review therapy session booking rates',
        'Consider pricing adjustments',
        'Increase marketing efforts'
      ]
    })
  }

  // Therapy utilization detection
  actual.therapyMetrics.forEach((actualTherapy, idx) => {
    const plannedTherapy = plan.therapyMetrics[idx]
    if (plannedTherapy) {
      const utilization = (actualTherapy.sessions / plannedTherapy.sessions) * 100
      if (utilization < 60) {
        alerts.push({
          id: `therapy-underutilized-${actualTherapy.id}`,
          type: 'THERAPY_UNDERUTILIZED',
          severity: 'warning',
          title: `${actualTherapy.name}: Only ${utilization.toFixed(0)}% Utilized`,
          message: `Expected ${plannedTherapy.sessions} sessions, got ${actualTherapy.sessions}`,
          metric: `therapy_${actualTherapy.id}_sessions`,
          currentValue: actualTherapy.sessions,
          expectedValue: plannedTherapy.sessions,
          variance: actualTherapy.sessions - plannedTherapy.sessions,
          variancePercent: utilization - 100,
          actionItems: [
            `Review ${actualTherapy.name} pricing`,
            `Update marketing for this therapy type`,
            'Adjust capacity allocation'
          ]
        })
      }
    }
  })

  return alerts
}
```

**`forecast-calculator.ts`** - NEW
```typescript
export function calculateForecast(
  historicalData: MetricsData[],
  monthsAhead: number = 6
): ForecastData[] {
  // Simple linear trend forecast based on last 6 months
  if (historicalData.length < 2) return []

  const recentData = historicalData.slice(-6)
  const monthlyRevenues = recentData.map(m => m.totalRevenue)

  // Calculate trend
  const n = monthlyRevenues.length
  const xValues = Array.from({ length: n }, (_, i) => i)
  const xMean = xValues.reduce((a, b) => a + b) / n
  const yMean = monthlyRevenues.reduce((a, b) => a + b) / n

  const slope = xValues.reduce((sum, x, i) =>
    sum + (x - xMean) * (monthlyRevenues[i] - yMean), 0
  ) / xValues.reduce((sum, x) => sum + (x - xMean) ** 2, 0)

  const intercept = yMean - slope * xMean

  // Generate forecasts
  const forecasts: ForecastData[] = []
  for (let i = 1; i <= monthsAhead; i++) {
    const forecastValue = slope * (n + i - 1) + intercept
    const confidence = Math.max(0.5, Math.min(0.95, 0.7 + (i * -0.02)))

    forecasts.push({
      month: addMonths(new Date(), i),
      forecastedRevenue: Math.max(0, forecastValue),
      confidence,
      upperBound: forecastValue * (2 - confidence),
      lowerBound: forecastValue * confidence
    })
  }

  return forecasts
}
```

### Layer 2: Unified Metrics Engine

**Location**: `lib/metrics/unified-metrics.ts`

This is the single entry point for all dashboard data. It coordinates calculators and enforces consistent data shapes across scopes.

```typescript
export type MetricsScope = 'month' | 'quarter' | 'year' | 'allTime'
export type ComparisonMode = 'none' | 'plan' | 'lastPeriod' | 'lastYear'

export interface UnifiedMetricsInput {
  scope: MetricsScope
  date?: Date
  compareMode?: ComparisonMode
  userId: string
}

export interface UnifiedMetricsResponse {
  scope: MetricsScope
  period: { start: Date, end: Date }
  comparison?: { mode: ComparisonMode, data: MetricsData }

  // Tier 1: Critical metrics
  viabilityScore: ViabilityScore
  breakEvenStatus: 'surplus' | 'breakeven' | 'deficit'
  netIncome: number

  // Tier 2: Primary metrics
  totalRevenue: number
  totalExpenses: number
  totalSessions: number
  averageSessionPrice: number

  // Tier 3: Detailed breakdown
  therapyMetrics: TherapyMetric[]
  monthlyBreakdown?: MonthlyMetric[]

  // Actionable intelligence
  variances: VarianceAlert[]
  forecast?: ForecastData[]

  lastUpdated: Date
}

export async function getUnifiedMetrics(
  input: UnifiedMetricsInput
): Promise<UnifiedMetricsResponse> {
  const supabase = await createClient()

  // 1. Fetch raw data based on scope
  const rawData = await fetchScopeData(input)

  // 2. Calculate metrics using pure functions
  const calculatedMetrics = {
    revenue: calculateSessionRevenue(...),
    margins: calculateMargin(...),
    sessions: calculateSessionMetrics(...),
    viability: calculateViabilityScore(...)
  }

  // 3. Get comparison data if requested
  let comparisonData = null
  if (input.compareMode && input.compareMode !== 'none') {
    const comparisonPeriod = getComparisonPeriod(input.scope, input.date, input.compareMode)
    comparisonData = await fetchScopeData({ ...input, date: comparisonPeriod })
  }

  // 4. Detect variances
  const variances = detectVariances(calculatedMetrics, comparisonData?.metrics)

  // 5. Generate forecast (if annual or longer scope)
  let forecast = null
  if (input.scope === 'year' || input.scope === 'allTime') {
    const historicalData = await fetchHistoricalData(input.userId, 12)
    forecast = calculateForecast(historicalData, 6)
  }

  // 6. Return unified response
  return {
    scope: input.scope,
    period: getPeriodDates(input.scope, input.date),
    comparison: comparisonData ? {
      mode: input.compareMode!,
      data: comparisonData
    } : undefined,
    viabilityScore: calculatedMetrics.viability,
    breakEvenStatus: calculatedMetrics.margins.breakEven ? 'surplus' : 'deficit',
    netIncome: calculatedMetrics.margins.margin,
    totalRevenue: calculatedMetrics.revenue.revenue,
    totalExpenses: calculatedMetrics.expenses,
    totalSessions: calculatedMetrics.sessions.actualSessions,
    averageSessionPrice: calculatedMetrics.revenue.averagePrice,
    therapyMetrics: rawData.therapies,
    monthlyBreakdown: input.scope === 'quarter' || input.scope === 'year'
      ? rawData.monthlyBreakdown
      : undefined,
    variances,
    forecast,
    lastUpdated: new Date()
  }
}
```

### Layer 3: Dashboard Components

**Location**: `components/dashboard/`

Components are now simplified - they receive formatted metrics data and focus purely on presentation. The unified metrics engine handles all calculation logic.

#### 3.1 Header Components
```
components/dashboard/header/
├── viability-score.tsx        # Displays 0-100 score with trend
├── break-even-indicator.tsx   # Shows progress to break-even
└── current-summary-bar.tsx    # Executive summary line
```

#### 3.2 Primary View Components
```
components/dashboard/primary-view/
├── kpi-cards.tsx              # 6 metric cards (adapts to scope)
├── variance-alerts.tsx        # Alert system for deviations
├── context-toggle.tsx         # Month/Quarter/Year/AllTime switcher
└── comparison-mode.tsx        # Plan vs Actual overlay toggle
```

#### 3.3 Detail View Components
```
components/dashboard/detail-view/
├── therapy-performance-matrix.tsx   # Table of all therapies
├── revenue-breakdown.tsx            # Pie chart or bar chart
├── forecast-chart.tsx               # Line chart with projection band
└── variance-details.tsx             # Expanded alert information
```

#### 3.4 Example Component (Simplified)
```typescript
// components/dashboard/primary-view/kpi-cards.tsx
interface KPICardsProps {
  metrics: UnifiedMetricsResponse
}

export function KPICards({ metrics }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Revenue Card */}
      <MetricCard
        title="Revenue"
        value={formatEuro(metrics.totalRevenue)}
        icon={DollarSign}
        subtext={`${metrics.totalSessions} sessions`}
        trend={metrics.comparison?.variancePercent}
        onClick={() => expandDetail('revenue')}
      />

      {/* Expenses Card */}
      <MetricCard
        title="Expenses"
        value={formatEuro(metrics.totalExpenses)}
        icon={TrendingUp}
        subtext="Tracked spending"
        status={metrics.totalExpenses > metrics.totalRevenue ? 'alert' : 'normal'}
      />

      {/* Net Income Card */}
      <MetricCard
        title="Net Income"
        value={formatEuro(metrics.netIncome)}
        icon={PieChart}
        subtext={`${metrics.totalRevenue > 0 ? ((metrics.netIncome / metrics.totalRevenue) * 100).toFixed(1) : 0}% margin`}
        trend={metrics.netIncome >= 0 ? 'positive' : 'negative'}
      />
    </div>
  )
}
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ User Interaction (Dashboard Page)                            │
│ - Selects time scope (Month/Quarter/Year)                   │
│ - Toggles comparison mode (None/Plan/LastPeriod/LastYear)   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ Unified Metrics Engine (getUnifiedMetrics)                   │
│ Input: scope, date, compareMode, userId                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌────────┐  ┌─────────┐  ┌──────────┐
    │Database│  │Calculators│ │Variance  │
    │Queries │  │           │ │Detection │
    └────┬───┘  └─────┬─────┘ └────┬─────┘
         │            │            │
         └────────────┼────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │ UnifiedMetricsResponse   │
         │ - viabilityScore         │
         │ - totalRevenue           │
         │ - variances[]            │
         │ - forecast[]             │
         └────────┬─────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
    ┌──────────┐    ┌─────────────┐
    │Dashboard │    │Detailed View│
    │Component │    │Components   │
    └──────────┘    └─────────────┘
         │                 │
         └────────┬────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Rendered HTML    │
         │ (User sees UI)   │
         └──────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create calculation layer (`lib/calculations/`)
  - [ ] Core calculators (revenue, margin, sessions)
  - [ ] Unit tests for all calculators
- [ ] Create composite calculators
  - [ ] Viability score calculator
  - [ ] Variance detection system
- [ ] Update TypeScript types

### Phase 2: Unification (Week 2)
- [ ] Implement unified metrics engine (`lib/metrics/unified-metrics.ts`)
- [ ] Create data fetching helpers
- [ ] Refactor database queries
- [ ] Add comprehensive tests

### Phase 3: UI Refactoring (Week 3)
- [ ] Refactor dashboard components
- [ ] Create new components (header, alerts, context toggle)
- [ ] Update component interactions
- [ ] Integrate with unified metrics engine

### Phase 4: Migration & Testing (Week 4)
- [ ] Update all page components to use new metrics
- [ ] Run full integration tests
- [ ] Performance testing
- [ ] User acceptance testing

### Phase 5: Polish (Week 5)
- [ ] Accessibility audit
- [ ] Mobile responsive fixes
- [ ] Performance optimization
- [ ] Documentation updates

---

## File Organization

```
lib/
├── calculations/
│   ├── core/
│   │   ├── revenue-calculator.ts
│   │   ├── margin-calculator.ts
│   │   ├── session-calculator.ts
│   │   └── __tests__/
│   │       ├── revenue-calculator.test.ts
│   │       ├── margin-calculator.test.ts
│   │       └── session-calculator.test.ts
│   │
│   ├── composite/
│   │   ├── viability-calculator.ts
│   │   ├── variance-detector.ts
│   │   ├── forecast-calculator.ts
│   │   └── __tests__/
│   │       ├── viability-calculator.test.ts
│   │       ├── variance-detector.test.ts
│   │       └── forecast-calculator.test.ts
│   │
│   ├── index.ts                    [export all]
│   └── types.ts                    [CalculationTypes]
│
├── metrics/
│   ├── unified-metrics.ts
│   ├── helpers.ts                  [period calculations, comparisons]
│   ├── __tests__/
│   │   └── unified-metrics.test.ts
│   └── types.ts                    [UnifiedMetricsResponse, etc]
│
└── actions/
    └── dashboard.ts                [DEPRECATED: keep for backward compat]

components/
├── dashboard/
│   ├── header/
│   │   ├── viability-score.tsx
│   │   ├── break-even-indicator.tsx
│   │   └── current-summary-bar.tsx
│   │
│   ├── primary-view/
│   │   ├── kpi-cards.tsx
│   │   ├── variance-alerts.tsx
│   │   ├── context-toggle.tsx
│   │   └── comparison-mode.tsx
│   │
│   ├── detail-view/
│   │   ├── therapy-performance-matrix.tsx
│   │   ├── revenue-breakdown.tsx
│   │   ├── forecast-chart.tsx
│   │   └── variance-details.tsx
│   │
│   ├── shared/
│   │   ├── metric-card.tsx
│   │   └── formatters.ts
│   │
│   └── Dashboard.tsx              [Main orchestrator component]
```

---

## Migration Strategy

### Backward Compatibility
- Keep existing `lib/actions/dashboard.ts` functions
- Implement as thin wrappers around unified metrics engine
- Deprecation warnings in comments
- Gradual migration path for dependent code

### Testing Strategy
1. **Unit Tests**: Each calculator function tested independently
2. **Integration Tests**: Unified metrics engine tested with real database
3. **Component Tests**: Dashboard components tested with mock metrics
4. **E2E Tests**: Full user workflow (select scope, view data, interact)

### Rollout Plan
1. Implement and test new layer in development
2. Deploy calculation layer (no UI changes)
3. Deploy metrics engine (new API, old code still works)
4. Gradually migrate components to new engine
5. Remove old functions once all components migrated

---

## Success Criteria

1. **Code Quality**
   - [ ] All calculator functions have 100% test coverage
   - [ ] Unified metrics engine has no duplicate logic
   - [ ] TypeScript strict mode passes

2. **Performance**
   - [ ] Dashboard loads in <1s (current: track baseline)
   - [ ] No performance regression vs current implementation
   - [ ] Calculations cached where appropriate

3. **User Experience**
   - [ ] Same metrics displayed across all scopes (no data discrepancies)
   - [ ] Variance alerts surface critical issues immediately
   - [ ] Scope switching fast and smooth (no loading states)

4. **Maintainability**
   - [ ] Changing a formula requires update in exactly 1 place
   - [ ] Adding new metric requires minimal changes
   - [ ] Code is easily understood by new team members

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Regression in existing metrics | Medium | High | Comprehensive test suite before deployment |
| Performance degradation | Low | Medium | Benchmark current performance, profile new code |
| Incomplete migration | Medium | Medium | Use deprecation warnings, gradual rollout |
| Scope complexity underestimated | Low | High | Build Phase 1 as spike to validate approach |

---

## References

- Current dashboard: `app/dashboard/page.tsx`
- Current calculators: `lib/actions/dashboard.ts`
- Current components: `components/dashboard/*`
- UI/UX design document: (to be created in Phase 4)
- Database schema: `supabase/migrations/001_create_tables.sql`
