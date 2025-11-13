# Implementation Plan: Performance Optimization

**Workbranch:** `feature/perf-optimization`
**Estimated Time:** 5 days
**Priority:** Phase 1 (Weeks 1-2)

---

## Overview

This plan details the step-by-step implementation of the "Quick Wins" performance optimization approach, targeting 30-40% improvement in:
- Initial page load (3-5s → 1-2s)
- Navigation between pages (1-2s → 300-500ms)
- Data operations (2-3s → 500ms-1s)

---

## Task Breakdown

### Phase 1: Code Splitting & Dynamic Imports (Days 1-2)

**Goal:** Reduce initial bundle size by 25-30%

#### Task 1.1: Analyze Current Bundle
```bash
# In perf-optimization worktree
npm run build
npm install --save-dev webpack-bundle-analyzer
npm run analyze-bundle # Add script to next.config.ts
```

**Files to Create:**
- `scripts/analyze-bundle.js` - Bundle analysis script
- `BUNDLE_ANALYSIS.md` - Baseline report

**Success Criteria:**
- [ ] Current bundle analyzed and documented
- [ ] Identify top 10 largest dependencies
- [ ] Find which components contribute most to size

#### Task 1.2: Dynamic Import Heavy Components
```typescript
// app/dashboard/page.tsx
const TaxPlanningCard = dynamic(
  () => import('@/components/dashboard/tax-planning-card'),
  { loading: () => <SkeletonCard /> }
)

const DataImportDialog = dynamic(
  () => import('@/components/dashboard/data-import-dialog'),
  { loading: () => null, ssr: false }
)

const BreakEvenChart = dynamic(
  () => import('@/components/dashboard/break-even-chart'),
  { loading: () => <ChartSkeleton /> }
)
```

**Components to Split:**
1. TaxPlanningCard (~8KB)
2. DataImportDialog (~12KB)
3. BreakEvenChart (~6KB)
4. FinancialReports (~5KB)
5. ExpenseDialog (~4KB)

**Files to Modify:**
- `app/dashboard/page.tsx`
- `app/dashboard/layout.tsx`
- `app/dashboard/berichte/page.tsx`
- `app/dashboard/analyse/page.tsx`
- `components/dashboard/expense-list.tsx`

**Success Criteria:**
- [ ] All 5 components dynamically imported
- [ ] Loading skeletons in place
- [ ] No visual regression
- [ ] Bundle size reduced > 20%

#### Task 1.3: Lazy Load Dashboard Subpages
```typescript
// app/dashboard/layout.tsx
const TherapieRoute = dynamic(() => import('./therapien/page'))
const AnalysisRoute = dynamic(() => import('./analyse/page'))
const ReportRoute = dynamic(() => import('./berichte/page'))
```

**Files to Modify:**
- `app/dashboard/layout.tsx` - Convert subroutes to dynamic imports

**Success Criteria:**
- [ ] Subpage routes lazy loaded
- [ ] Navigation still works smoothly
- [ ] No console errors

---

### Phase 2: Supabase Query Optimization (Days 2-3)

**Goal:** Reduce network time by 40-50%

#### Task 2.1: Audit All Supabase Queries
**Goal:** Document all queries and their column usage

```bash
# Find all Supabase queries
grep -r "\.select\(" lib/ app/ --include="*.ts" --include="*.tsx"
```

**Output Document:** `docs/SUPABASE_QUERIES.md`

**Format for each query:**
```markdown
## File: lib/actions/dashboard.ts
Function: `getDashboardSummary()`
Current: `select('*')`
Used columns: id, user_id, revenue, expenses
Opportunity: Select only those columns
Estimated savings: 2-3 columns = 10-15% faster
```

**Files to Audit:**
- `lib/actions/*.ts` (7 files)
- `lib/queries/*.ts` (3 files)

**Success Criteria:**
- [ ] All queries documented
- [ ] Column usage identified
- [ ] Optimization opportunities listed

#### Task 2.2: Optimize Query Field Selection
```typescript
// Before
const { data } = await supabase
  .from('therapy_types')
  .select('*')
  .eq('user_id', userId)

// After
const { data } = await supabase
  .from('therapy_types')
  .select('id, name, price_per_session, color')
  .eq('user_id', userId)
```

**Files to Modify:**
- `lib/actions/analysis.ts` - 3 queries
- `lib/actions/dashboard.ts` - 4 queries
- `lib/actions/monthly-plans.ts` - 2 queries
- `lib/queries/monthly-plans.ts` - 2 queries
- `lib/actions/expenses.ts` - 3 queries

**Total Queries to Optimize:** 14

**Process for Each Query:**
1. Find usage of returned fields
2. List only required columns
3. Test in browser (DevTools Network tab)
4. Verify no missing fields in UI

**Success Criteria:**
- [ ] All 14 queries optimized
- [ ] No console errors
- [ ] Network request size reduced 20-30%

#### Task 2.3: Implement SWR Caching
```typescript
// lib/hooks/useTherapies.ts
import useSWR from 'swr'
import { getTherapies } from '@/lib/actions/dashboard'

export function useTherapies(userId: string) {
  const { data, error, isLoading } = useSWR(
    [`therapies-${userId}`],
    () => getTherapies(userId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      focusThrottleInterval: 300000, // 5 minutes
    }
  )

  return { data, error, isLoading }
}
```

**Hooks to Create:**
1. `useTherapies(userId)` - Cached therapy list
2. `useExpenses(userId, month?)` - Cached expenses
3. `useMonthlyPlans(userId)` - Cached plans
4. `useDashboardSummary(userId)` - Cached summary

**Files to Create:**
- `lib/hooks/useTherapies.ts`
- `lib/hooks/useExpenses.ts`
- `lib/hooks/useMonthlyPlans.ts`
- `lib/hooks/useDashboardSummary.ts`

**Files to Modify (to use hooks):**
- `components/dashboard/therapy-table.tsx`
- `components/dashboard/expense-list.tsx`
- `app/dashboard/planung/page.tsx`
- `app/dashboard/page.tsx`

**Success Criteria:**
- [ ] 4 SWR hooks implemented
- [ ] All components using hooks instead of direct actions
- [ ] Repeated requests cached (1 minute)
- [ ] No UI regression

#### Task 2.4: Add Request Debouncing
```typescript
// lib/utils/debounce.ts
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// Usage in forms
const handleUpdateExpense = debounce(async (expense) => {
  await updateExpenseAction(expense)
}, 500)
```

**Files to Modify:**
- `components/dashboard/expense-dialog.tsx` - Debounce save
- `components/dashboard/settings-form.tsx` - Debounce save
- `components/dashboard/therapy-dialog.tsx` - Debounce save

**Success Criteria:**
- [ ] Debounce utility created
- [ ] Applied to 3 dialogs/forms
- [ ] Rapid submissions don't cause multiple API calls

---

### Phase 3: React.memo Strategic Placement (Days 3-4)

**Goal:** Improve page transition speed by 20-30%

#### Task 3.1: Wrap Expensive Components with memo
```typescript
// components/dashboard/tax-planning-card.tsx
export const TaxPlanningCard = React.memo(
  function TaxPlanningCardMemo({ userId, year }: Props) {
    return (...)
  },
  (prevProps, nextProps) => {
    return prevProps.userId === nextProps.userId &&
           prevProps.year === nextProps.year
  }
)
```

**Components to Wrap (5 total):**
1. `TaxPlanningCard` - Complex calculations
2. `BreakEvenChart` - Large Recharts component
3. `ExpenseTable` - Large list with many rows
4. `TherapyTable` - Large list with many rows
5. `MonthlyPlansGrid` - Grid with many cells

**Files to Modify:**
- `components/dashboard/tax-planning-card.tsx`
- `components/dashboard/break-even-chart.tsx`
- `components/dashboard/expense-table.tsx`
- `components/dashboard/therapy-table.tsx`
- `components/dashboard/planner-grid.tsx`

**Success Criteria:**
- [ ] 5 components wrapped with memo
- [ ] Custom comparison functions added where needed
- [ ] No visual regression
- [ ] Dashboard transitions faster

#### Task 3.2: Add useMemo for Expensive Calculations
```typescript
// In components where data is processed
const expensesByCategory = useMemo(() => {
  return expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {} as Record<string, number>)
}, [expenses])
```

**Locations to Add useMemo:**
1. `app/dashboard/page.tsx` - KPI calculations
2. `app/dashboard/berichte/page.tsx` - Report aggregations
3. `components/dashboard/tax-planning-card.tsx` - Tax calculations
4. `components/dashboard/break-even-chart.tsx` - Chart data processing

**Success Criteria:**
- [ ] useMemo added to 4 locations
- [ ] Expensive calculations memoized
- [ ] No unnecessary re-computations

---

### Phase 4: Asset Optimization & Caching (Days 4-5)

**Goal:** 5-10% reduction in asset size + faster navigation

#### Task 4.1: Optimize Assets
```typescript
// next.config.ts - Enable image optimization
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
},

// Remove unused Lucide icons - add to package.json
// Bundle only used icons
```

**Tasks:**
1. Audit Lucide icon usage - create list of used icons
2. Remove unused icon imports
3. Add Next.js Image component to strategic places
4. Configure image formats (webp, avif)

**Files to Modify:**
- `next.config.ts` - Image optimization
- `lib/constants.ts` - Icon registry
- Any `.tsx` files with `<img>` tags

**Success Criteria:**
- [ ] Unused Lucide imports removed
- [ ] Image component optimized
- [ ] Asset bundle reduced 5-10%

#### Task 4.2: Enable Static Generation & ISR
```typescript
// app/dashboard/page.tsx
export const revalidate = 3600 // Revalidate every hour

// app/dashboard/analyse/page.tsx
export const dynamic = 'force-static'
export const revalidate = 300 // 5 minutes

// API route
export const dynamic = 'force-static'
export const revalidate = 300
```

**Pages to Add ISR:**
- `app/dashboard/page.tsx` - revalidate: 3600s
- `app/page.tsx` - revalidate: 1800s
- `app/dashboard/therapien/page.tsx` - revalidate: 300s
- API routes - Analyze and add revalidate

**Success Criteria:**
- [ ] ISR enabled on 4 pages
- [ ] Cache headers verified in DevTools
- [ ] Build time doesn't increase significantly

---

### Phase 5: Testing & Benchmarking (Day 5)

**Goal:** Verify 30-40% improvement

#### Task 5.1: Lighthouse Analysis
```bash
npm run build
npm install --save-dev lighthouse-ci

# Run baseline measurements
lighthouse http://localhost:3002/ --view
lighthouse http://localhost:3002/dashboard --view
lighthouse http://localhost:3002/dashboard/analyse --view
```

**Metrics to Track:**
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Total Blocking Time (TBT)
- Page Load Time
- Time to Interactive (TTI)

**Document in:** `docs/PERFORMANCE_RESULTS.md`

#### Task 5.2: Real-world Testing
- Navigate through all pages (timer each transition)
- Create therapy, expense, plan (timer each save)
- Import data (timer process)
- Measure on throttled network (DevTools)

**Document:** Page load times, navigation times, operation times

#### Task 5.3: Performance Report
Create comprehensive report showing:
```markdown
# Performance Optimization Results

## Metrics Improvement
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial Load | 4.2s | 1.8s | 57% ✅ |
| LCP | 3.5s | 1.2s | 66% ✅ |
| Navigation | 1.5s | 0.4s | 73% ✅ |
| Form Save | 2.1s | 0.8s | 62% ✅ |

## Bundle Size
- Initial: 450KB
- Optimized: 280KB
- Reduction: 38% ✅

## Lighthouse Scores
- Before: Performance 45, Accessibility 92, Best Practices 87, SEO 100
- After: Performance 88, Accessibility 92, Best Practices 87, SEO 100
```

**Success Criteria:**
- [ ] 30-40% improvement verified
- [ ] All metrics show improvement
- [ ] Lighthouse score > 80
- [ ] Report committed to git

---

## Verification Checklist

- [ ] No console errors or warnings
- [ ] All pages load without error
- [ ] All CRUD operations work (create, read, update, delete)
- [ ] Forms submit correctly
- [ ] Charts render properly
- [ ] No layout shifts or visual regression
- [ ] Navigation transitions smoothly
- [ ] Responsive design still works (mobile, tablet)
- [ ] Dark mode still works
- [ ] Keyboard shortcuts work (if applicable)
- [ ] Performance improved 30-40%

---

## Rollback Plan

If any optimization causes issues:

```bash
# View changes made
git diff main feature/perf-optimization

# If critical issue, revert specific commit
git revert <commit-hash>

# Or reset entire branch
git reset --hard main
```

---

## Testing Commands

```bash
# Build and analyze
npm run build
npm run analyze-bundle

# Run tests
npm run test

# Local testing
npm run dev

# Lighthouse scan
lighthouse http://localhost:3002

# Performance profiling
npm run profile
```

---

## Success Definition

✅ **Performance Optimization Complete When:**
1. Bundle size reduced 25-30%
2. Initial page load < 2 seconds
3. Navigation < 500ms
4. Form submission < 1 second
5. Lighthouse Performance score > 80
6. All tests passing
7. No visual regression
8. Report committed and merged to main

