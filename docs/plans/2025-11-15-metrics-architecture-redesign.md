# Metrics Architecture Redesign: Planned vs Actual Separation

**Date:** 2025-11-15
**Status:** Design Complete - Ready for Implementation
**Objective:** Separate planned (forecasted) metrics from actual (results) metrics on the dashboard while enabling automatic merger of Latido and manual session data.

---

## Problem Statement

The current dashboard only calculates revenue from `actual_sessions` in the `monthly_plans` table. This creates a "no data" experience for users:
- User creates 8 therapy types with planned sessions
- Dashboard shows €0,00 revenue because `actual_sessions` is empty
- User cannot see their financial forecast until they fill in actual session data

Additionally, there's no clear architectural separation between planned metrics (user's forecast) and actual metrics (completed business results), creating ambiguity about which numbers represent what.

---

## Solution Overview

Split metrics calculations into two explicit, parallel calculation paths:

1. **Planned Metrics Module** - Reads from `planned_sessions` column, represents financial forecast
2. **Actual Metrics Module** - Reads from `actual_sessions` column, represents completed business results

Both modules use identical interface design (same metrics calculated from different source data), but are completely separate functions that never interact. Dashboard displays both sections: "Forecasting" (planned) and "Results" (actual).

---

## Architecture

### Data Model (No Changes Required)

The `monthly_plans` table already has both columns:
```sql
monthly_plans {
  id
  user_id
  therapy_id
  month_year          -- YYYY-MM-01
  planned_sessions    -- Forecast (user input)
  actual_sessions     -- Results (incremented by Latido OR Session Logger)
  created_at
  updated_at
}
```

No migration needed. Both Latido integration and Session Logger write to the same `actual_sessions` column via simple increment operations.

---

## Module Structure

### `/lib/metrics/metrics-result.ts` (Shared Interface)

Both modules return this interface - makes planned/actual metrics completely parallel:

```typescript
export interface MetricsResult {
  total_sessions: number
  total_revenue: number
  total_variable_costs: number
  total_margin: number
  margin_percent: number
  break_even_status: 'surplus' | 'breakeven' | 'deficit'

  by_therapy: TherapyMetrics[]
}

export interface TherapyMetrics {
  therapy_id: string
  therapy_name: string
  sessions: number
  price_per_session: number
  revenue: number
  variable_cost_per_session: number
  variable_costs: number
  margin: number
}
```

### `/lib/metrics/planned-metrics.ts`

```typescript
export async function getPlannedMetrics(
  userId: string,
  monthYear: string
): Promise<MetricsResult> {
  // Queries monthly_plans WHERE user_id = userId AND month_year = monthYear
  // Sums: planned_sessions × price_per_session = planned_revenue
  // Sums: planned_sessions × variable_cost = planned_variable_costs
  // Calculates: planned_margin = planned_revenue - planned_variable_costs
  // Returns MetricsResult structure
}
```

**Key detail:** Reads only from `planned_sessions` column. Never touches `actual_sessions`.

### `/lib/metrics/actual-metrics.ts`

```typescript
export async function getActualMetrics(
  userId: string,
  monthYear: string
): Promise<MetricsResult> {
  // Queries monthly_plans WHERE user_id = userId AND month_year = monthYear
  // Sums: actual_sessions × price_per_session = actual_revenue
  // Sums: actual_sessions × variable_cost = actual_variable_costs
  // Calculates: actual_margin = actual_revenue - actual_variable_costs
  // Returns MetricsResult structure (identical interface)
}
```

**Key detail:** Reads only from `actual_sessions` column. Never touches `planned_sessions`.

---

## Dashboard Integration

### New Response Interface

```typescript
export interface DashboardMetrics {
  month_year: string

  forecast: MetricsResult       // Planned metrics
  results: MetricsResult        // Actual metrics

  history_12_months: {
    month: string
    forecast_revenue: number
    actual_revenue: number
  }[]
}
```

### New Server Action

```typescript
// /lib/actions/dashboard.ts
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const userId = await getAuthUserId()
  const monthYear = getCurrentMonthYear()

  const [forecast, results] = await Promise.all([
    getPlannedMetrics(userId, monthYear),
    getActualMetrics(userId, monthYear)
  ])

  const history_12_months = await get12MonthHistory(userId)

  return {
    month_year: monthYear,
    forecast,
    results,
    history_12_months
  }
}
```

---

## Frontend Components

### Dashboard Layout

```
┌─ Forecasting Section ────────────────────────┐
│ Shows planned metrics from planned_sessions   │
│ KPI Cards: Revenue, Sessions, Margin, etc.   │
└──────────────────────────────────────────────┘

┌─ Results Section ────────────────────────────┐
│ Shows actual metrics from actual_sessions     │
│ KPI Cards: Revenue, Sessions, Margin, etc.   │
└──────────────────────────────────────────────┘

┌─ 12-Month Trend ─────────────────────────────┐
│ Chart: Planned vs Actual Revenue by Month    │
└──────────────────────────────────────────────┘
```

---

## Session Logger (Actual Data Entry)

### New Page: `/app/sessions/logger/page.tsx`

Form-based interface to record completed sessions:

```typescript
interface SessionLogEntry {
  therapy_id: string      // Dropdown of user's therapies
  month_year: string      // Date picker (YYYY-MM)
  sessions: number        // How many sessions completed
  // Revenue auto-calculated on client: sessions × price_per_session
}
```

On submit:
- Calls `/api/sessions/log` endpoint
- Endpoint increments `actual_sessions` in `monthly_plans` table by the submitted count
- If month/therapy doesn't exist, creates row with `actual_sessions` = count

### API Endpoint: `/app/api/sessions/log/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { therapy_id, month_year, sessions_count } = await request.json()

  const supabase = await createClient()
  const userId = await getAuthUserId()

  // Upsert: If row exists, increment actual_sessions; if not, create with value
  await supabase.rpc('increment_actual_sessions', {
    p_user_id: userId,
    p_therapy_id: therapy_id,
    p_month_year: month_year,
    p_increment: sessions_count
  })

  return NextResponse.json({ success: true })
}
```

---

## Latido Integration Point

When Latido data is imported:
1. Parse completed sessions from Latido export
2. For each session, call `/api/sessions/log` with count
3. Same increment operation as manual logging

**Key design advantage:** No special handling needed. Latido and Session Logger both use identical increment mechanism. They merge automatically in the `actual_sessions` column.

---

## Clarity & Naming Conventions

To prevent confusion between planned and actual throughout the codebase:

| Context | Naming | Source |
|---------|--------|--------|
| Dashboard sections | "Forecasting" vs "Results" | Clear labels in UI |
| Function names | `getPlannedMetrics()` vs `getActualMetrics()` | Module names make source explicit |
| Interface field names | `forecast: MetricsResult` vs `results: MetricsResult` | Names show purpose |
| Database columns | `planned_sessions` vs `actual_sessions` | Column names unambiguous |
| Session Logger UI | "Log Completed Sessions" | Clear action intent |

No ambiguity is possible because:
- Each calculation function reads from only one source (never both)
- Dashboard clearly labels which section is which
- Variable names indicate planned/actual throughout

---

## Implementation Steps

1. Create metric calculation modules (`planned-metrics.ts`, `actual-metrics.ts`)
2. Update dashboard server action to call both in parallel
3. Create Session Logger page and API endpoint
4. Update dashboard components to display both forecast and results sections
5. Test data flow: Plan sessions → See forecast → Log actual sessions → See results

---

## Success Criteria

- [ ] Dashboard shows planned revenue (€XXX) in Forecasting section immediately after user inputs planned sessions
- [ ] Dashboard shows actual revenue (€XXX) in Results section only when actual_sessions is filled
- [ ] 12-month history chart shows both planned and actual trends
- [ ] Session Logger page accepts manual session entries
- [ ] Session Logger increments actual_sessions correctly
- [ ] Latido integration can write to actual_sessions via same endpoint
- [ ] No confusion in codebase about which metrics are planned vs actual

---

## Future Enhancements (Out of Scope)

- Variance analysis: Show forecast vs actual delta with explanations
- Forecast adjustments: Allow users to re-forecast mid-month
- Session reconciliation UI: Highlight discrepancies between Latido and manual logging
