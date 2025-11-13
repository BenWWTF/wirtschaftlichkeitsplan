# Wirtschaftlichkeitsplan: Performance Optimization + Native macOS App Design

**Date:** November 13, 2025
**Status:** Design Approved - Ready for Implementation
**Priority:** Performance Optimization (Weeks 1-2) → Swift macOS App (Weeks 2-4+)

---

## Executive Summary

This document outlines two major improvements to the Wirtschaftlichkeitsplan application:

1. **Performance Optimization** - Quick wins approach targeting 30-40% improvement
2. **Native macOS App** - Full-featured Swift application with MVVM-C architecture

Both run in parallel with separate git worktrees to minimize blocking.

---

## Part 1: Performance Optimization Strategy

### Problem Statement

Current performance bottlenecks:
- Initial page load is slow (home page takes 3-5 seconds)
- Dashboard navigation between pages has noticeable lag (1-2 seconds per page)
- Data operations (creating therapies/expenses/plans) feel sluggish (2-3 seconds)

### Solution: Quick Wins Approach

Five targeted optimizations providing 30-40% improvement with low complexity.

#### 1. Code Splitting & Dynamic Imports

**Current Issue:** All components bundle together, making initial JS payload large.

**Implementation:**
```typescript
// Before: All components loaded upfront
import { TaxPlanningCard } from '@/components/dashboard/tax-planning-card'
import { DataImportDialog } from '@/components/dashboard/data-import-dialog'

// After: Dynamic imports for heavy components
const TaxPlanningCard = dynamic(
  () => import('@/components/dashboard/tax-planning-card'),
  { loading: () => <div>Loading...</div>, ssr: false }
)

const DataImportDialog = dynamic(
  () => import('@/components/dashboard/data-import-dialog'),
  { loading: () => <div>Loading...</div>, ssr: false }
)
```

**Components to Split:**
- TaxPlanningCard (large tax calculator)
- DataImportDialog (complex import wizard)
- BreakEvenChart (Recharts visualization)
- FinancialReports (complex data aggregation)
- ExpenseDialog (form with state)

**Expected Impact:** 25-30% reduction in initial bundle size

#### 2. Supabase Query Optimization

**Current Issue:** Fetching all columns from tables, no request deduplication.

**Implementation:**

```typescript
// Before: Fetches all columns
const { data: therapies } = await supabase
  .from('therapy_types')
  .select('*')
  .eq('user_id', userId)

// After: Select only needed columns
const { data: therapies } = await supabase
  .from('therapy_types')
  .select('id, name, price_per_session, color')
  .eq('user_id', userId)

// Add request deduplication with SWR
import useSWR from 'swr'

const { data: therapies } = useSWR(
  ['therapy_types', userId],
  () => fetchTherapies(userId),
  { revalidateOnFocus: false, dedupingInterval: 60000 }
)
```

**Optimizations:**
- Reduce column selection in all queries
- Add field limiting for monthly_plans, expenses, settings
- Implement SWR/React Query caching for repeated requests
- Add request debouncing for rapid form submissions
- Use `.single()` instead of `.maybeSingle()` where appropriate

**Expected Impact:** 40-50% reduction in network time

#### 3. Strategic React.memo & useMemo Placement

**Current Issue:** Components re-render unnecessarily on parent state changes.

**Implementation:**

```typescript
// Memoize expensive components
export const TaxPlanningCard = React.memo(({ data, onUpdate }) => {
  // Component stays same, but won't re-render unless props change
  return (...)
})

// Memoize computed data
const expensesByCategory = useMemo(() => {
  return expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {})
}, [expenses])
```

**Components to Wrap:**
- ExpenseTable (memoize rows)
- TherapyTable (memoize rows)
- MonthlyPlansGrid (memoize each cell)
- BreakEvenChart (memoize chart props)
- TaxPlanningCard (memoize calculation results)

**Expected Impact:** 20-30% improvement in page transition speed

#### 4. Image & Asset Optimization

**Current Issue:** SVG icons and images not optimized.

**Implementation:**

```typescript
// Use Next.js Image component
import Image from 'next/image'

// Before: Standard img tag
<img src="/icons/therapy.svg" alt="Therapy" />

// After: Next.js Image with optimization
<Image
  src="/icons/therapy.svg"
  alt="Therapy"
  width={24}
  height={24}
  priority={false}
/>

// Optimize Lucide icons with size props
<TherapyIcon size={24} className="text-blue-600" />
```

**Optimizations:**
- Inline small SVGs as data URIs
- Use Next.js Image for all images
- Remove unused Lucide icons from bundle
- Add CSS minification

**Expected Impact:** 5-10% reduction in asset size

#### 5. Caching & Static Generation

**Current Issue:** Every page is dynamic, no static caching.

**Implementation:**

```typescript
// Add ISR (Incremental Static Regeneration) for stable pages
export const revalidate = 3600 // Revalidate every hour

// Add cache headers to API routes
export const dynamic = 'force-static'
export const revalidate = 300 // 5 minutes

// Implement Redis caching in Supabase
export async function getCachedTherapies(userId: string) {
  // Try cache first
  const cached = await redis.get(`therapies:${userId}`)
  if (cached) return JSON.parse(cached)

  // Fetch and cache
  const therapies = await supabase.from('therapy_types')...
  await redis.set(`therapies:${userId}`, JSON.stringify(therapies), 'EX', 3600)
  return therapies
}
```

**Optimizations:**
- Static generation for dashboard overview
- ISR for therapy lists and settings
- Request deduplication across pages
- Cache invalidation on data mutations

**Expected Impact:** 30-40% faster navigation

### Implementation Timeline

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 1-2 | Code splitting + lazy loading | 10 dynamic imports in place |
| 2-3 | Supabase query optimization | All queries select specific fields |
| 3-4 | React.memo strategic placement | 5 components memoized |
| 4-5 | Asset optimization + caching | ISR enabled, bundle analyzed |

**Testing & Benchmarking:**
- Run Lighthouse audit before/after
- Measure Core Web Vitals
- Performance profiling in Chrome DevTools
- Real-world navigation timing

---

## Part 2: Native macOS App Architecture

### Vision

A native SwiftUI application providing full feature parity with the web app, optimized for macOS with:
- Native look and feel
- Keyboard shortcuts (⌘ + key combinations)
- Dark mode support
- Offline-first architecture with sync
- Better performance than web version

### Architecture: MVVM-C (Model-View-ViewModel-Coordinator)

```
WirtschaftlichkeitsplanMac/
├── App/
│   ├── WirtschaftlichkeitsplanApp.swift
│   └── AppCoordinator.swift (navigation orchestrator)
│
├── Scenes/ (8 major scenes)
│   ├── Dashboard/
│   │   ├── DashboardView.swift
│   │   ├── DashboardViewModel.swift
│   │   └── DashboardCoordinator.swift
│   ├── Planning/ (Monatliche Planung)
│   ├── Therapies/ (Therapiearten)
│   ├── Analysis/ (Break-Even Analyse)
│   ├── Reports/ (Berichte)
│   ├── Expenses/ (Ausgaben)
│   ├── TaxPlanning/ (UltraThink)
│   └── DataImport/ (Daten Import)
│
├── Models/
│   ├── Therapy.swift
│   ├── MonthlyPlan.swift
│   ├── Expense.swift
│   ├── TaxCalculation.swift
│   └── ImportRow.swift
│
├── Services/
│   ├── SupabaseService.swift (Realtime + auth)
│   ├── CacheService.swift (Core Data cache)
│   ├── SyncService.swift (Background sync)
│   └── KeyboardShortcutService.swift
│
└── Utilities/
    ├── Constants.swift
    ├── Formatters.swift
    └── Extensions.swift
```

### Key Design Decisions

#### 1. Coordinator Pattern for Navigation

```swift
protocol Coordinator {
  var childCoordinators: [Coordinator] { get set }
  func start()
}

class AppCoordinator: NSObject, Coordinator {
  var childCoordinators: [Coordinator] = []

  func showTherapies() {
    let therapiesCoordinator = TherapiesCoordinator()
    childCoordinators.append(therapiesCoordinator)
    therapiesCoordinator.start()
  }

  func showExpenseDetail(_ expense: Expense) {
    // Navigate with data
  }
}
```

**Benefits:**
- Centralized navigation logic
- Easy to test navigation flows
- Clear separation of concerns
- Reusable coordinator components

#### 2. MVVM with @Published Properties

```swift
class DashboardViewModel: NSObject, ObservableObject {
  @Published var therapies: [Therapy] = []
  @Published var totalRevenue: Double = 0
  @Published var isLoading: Bool = false
  @Published var error: Error?

  func loadDashboard() {
    isLoading = true
    Task {
      do {
        let data = try await supabaseService.getDashboardData()
        await MainActor.run {
          self.therapies = data.therapies
          self.totalRevenue = data.revenue
          self.isLoading = false
        }
      } catch {
        await MainActor.run {
          self.error = error
          self.isLoading = false
        }
      }
    }
  }
}
```

**Benefits:**
- Reactive updates (SwiftUI observes @Published changes)
- Testable business logic separate from UI
- Async/await for clean async code
- Clear data flow

#### 3. Core Data for Offline Support

```swift
@Model
final class TherapyModel {
  #Unique var id: String
  var name: String
  var pricePerSession: Double
  var lastSyncedAt: Date?
  var isSynced: Bool = false

  // Relationships
  @Relationship(deleteRule: .cascade, inverse: \MonthlyPlanModel.therapy)
  var monthlyPlans: [MonthlyPlanModel] = []
}

// Usage in ViewModel
let descriptor = FetchDescriptor<TherapyModel>(
  predicate: #Predicate { $0.isSynced == false }
)
let pendingChanges = try modelContext.fetch(descriptor)
```

**Benefits:**
- Full offline capability
- Local caching reduces API calls
- Automatic conflict resolution
- Background sync queues

#### 4. Real-time Sync Architecture

```swift
class SyncService: NSObject, ObservableObject {
  @Published var syncStatus: SyncStatus = .idle

  func startBackgroundSync() {
    // Listen to Supabase Realtime changes
    supabaseService.subscribe(to: "therapy_types") { update in
      Task {
        await self.handleRemoteUpdate(update)
      }
    }

    // Periodic sync of pending changes
    Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { _ in
      Task {
        await self.syncPendingChanges()
      }
    }
  }

  func syncPendingChanges() async {
    // Upload local changes to Supabase
    // Handle conflicts with remote data
    // Mark as synced in Core Data
  }
}
```

**Benefits:**
- Real-time updates from other users
- Queues changes when offline
- Automatic retry with exponential backoff
- Conflict resolution strategies

### Keyboard Shortcuts

**Global Navigation (⌘ + Number):**
```
⌘1  - Dashboard
⌘2  - Planning (Monatliche Planung)
⌘3  - Therapies (Therapiearten)
⌘4  - Analysis (Break-Even)
⌘5  - Reports (Berichte)
⌘6  - Expenses (Ausgaben)
⌘7  - Tax Planning (UltraThink)
⌘8  - Import (Daten Import)
```

**Common Actions:**
```
⌘N  - New therapy type
⌘E  - New expense
⌘P  - New monthly plan
⌘I  - Open import dialog
⌘S  - Save/sync data
⌘,  - Open settings
⌘/  - Show keyboard shortcuts
⌘Shift+D - Toggle dark mode
⌘Shift+R - Refresh data
```

**Dialog Navigation:**
```
⌘↩  - Confirm/Save
⌘⌫  - Cancel
Tab/Shift+Tab - Navigate fields
```

### Distribution Strategy

**Phase 1: Developer Release (GitHub)**
- Direct download as `.app` package
- Users drag to Applications folder
- Auto-update via Sparkle framework

**Phase 2: Mac App Store (Optional)**
- Submit to MAS for wider distribution
- Sandboxing requirements
- Automatic updates through MAS

**Phase 3: Notarization**
- Apple Developer Program signing
- Notarization for Gatekeeper
- Security & privacy compliance

### Data Sync & Login

**Authentication:**
```swift
// User logs in once with Supabase auth
// Token stored in macOS Keychain
// Auto-login on app restart

class AuthService {
  func login(email: String, password: String) async throws {
    let response = try await supabase.auth.signIn(email: email, password: password)
    try keychain.store(response.session.accessToken, for: "access_token")
    return response.user
  }
}
```

**Data Sync:**
- Shared backend (same Supabase project)
- User data syncs across web and native app
- Conflict resolution: Last-write-wins with timestamp
- Background sync when network available

### Implementation Phases

#### Phase 1: Foundation (Days 1-7)
- Project setup with SwiftUI + MVVM-C
- AppCoordinator + navigation structure
- Basic Supabase integration
- Authentication flow

#### Phase 2: Core Features (Days 8-14)
- Dashboard scene
- Therapy management (CRUD)
- Monthly planning
- Basic charting

#### Phase 3: Advanced Features (Days 15-21)
- Break-even analysis
- Expense management
- Tax planning calculator
- Data import

#### Phase 4: Polish & Release (Days 22-28)
- Keyboard shortcuts
- Offline sync
- Performance optimization
- Testing & bug fixes
- Code signing & notarization

---

## Implementation Order

### Week 1: Performance Optimization
**Parallel work:** Swift app scaffolding (foundation)

### Weeks 2-4: Swift macOS App
**Parallel work:** Monitor performance optimizations in production

### Week 4+: Refinement & Distribution

---

## Success Criteria

### Performance Optimization
- [ ] Initial page load < 1.5 seconds (currently 3-5s)
- [ ] Navigation < 500ms per page (currently 1-2s)
- [ ] Form submission < 1 second (currently 2-3s)
- [ ] Lighthouse score > 80 (currently ~50)
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

### macOS App
- [ ] All 8 phases working in native Swift
- [ ] Keyboard shortcuts for all common actions
- [ ] Offline-first architecture tested
- [ ] Real-time sync with web version
- [ ] Mac App Store ready (notarized)
- [ ] Performance: All operations < 500ms

---

## Risk Mitigation

**Performance Optimization Risks:**
- Breaking existing functionality: Mitigate with comprehensive test suite
- Bundle size regression: Monitor with webpack-bundle-analyzer
- Cache invalidation issues: Implement careful cache invalidation strategy

**Swift App Risks:**
- Feature parity issues: Use shared data models with web version
- Sync conflicts: Implement last-write-wins with comprehensive testing
- Performance regression: Profile with Instruments throughout development

---

## Dependencies & Tools

**Web App Performance:**
- `next/dynamic` for code splitting
- `swr` or `react-query` for caching
- `webpack-bundle-analyzer` for bundle analysis
- Lighthouse CI for performance tracking

**macOS App:**
- Xcode 15+
- Swift 5.9+
- SwiftUI for UI
- SwiftData for Core Data
- Supabase Swift SDK
- Sparkle for auto-updates

---

## Timeline & Resources

**Performance Optimization:** 5 days
**Swift macOS App:** 21+ days (phased)
**Total Initial Scope:** 4 weeks
**Maintenance:** Ongoing

---

## Next Steps

1. ✅ Design approved
2. → Create detailed implementation plan
3. → Set up git worktrees (DONE)
4. → Begin performance optimization
5. → Begin Swift app scaffolding
6. → Weekly progress review

