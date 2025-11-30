# Phase 1: Breadcrumb Navigation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add breadcrumb navigation to all dashboard pages showing user's current location and enabling quick parent navigation.

**Architecture:** Create a reusable `BreadcrumbNav` component that uses Next.js hooks (`usePathname`, `useSearchParams`) to detect the current route and render breadcrumbs. A configuration file maps routes to human-readable labels. The component integrates into `app/dashboard/layout.tsx` to appear on all dashboard pages.

**Tech Stack:**
- React 19 with Next.js 15 hooks
- TypeScript for type safety
- Tailwind CSS for styling
- lucide-react for icons
- next-themes for dark mode support

---

## Task 1: Create Breadcrumb Configuration File

**Files:**
- Create: `lib/config/breadcrumb-config.ts`

**Step 1: Create the config file with route-to-label mappings**

Create `lib/config/breadcrumb-config.ts`:

```typescript
/**
 * Breadcrumb configuration mapping routes to human-readable labels
 */

export interface BreadcrumbItem {
  label: string
  href: string
}

export interface RouteBreadcrumbs {
  segments: string[] // route segments
  generateLabel: (segment: string, params?: Record<string, string>) => string
}

/**
 * Maps dashboard routes to breadcrumb configurations
 * Each route shows: Home > [Page] > [Optional Month]
 */
export const BREADCRUMB_CONFIG: Record<string, string> = {
  '/dashboard': 'Home',
  '/dashboard/planung': 'Monatliche Planung',
  '/dashboard/ergebnisse': 'Monatliche Ergebnisse',
  '/dashboard/therapien': 'Therapiearten',
  '/dashboard/ausgaben': 'Ausgaben',
  '/dashboard/steuerprognose': 'Meine Steuerprognose',
  '/dashboard/berichte': 'Geschäftsberichte',
  '/dashboard/einstellungen': 'Einstellungen',
  '/dashboard/analyse': 'Analyse',
}

/**
 * Generate month label from YYYY-MM format
 */
export function formatMonthLabel(monthString: string): string {
  if (!monthString || !monthString.match(/^\d{4}-\d{2}$/)) {
    return ''
  }

  const [year, month] = monthString.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)

  return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
}

/**
 * Generate breadcrumb items for a given pathname and search params
 */
export function generateBreadcrumbs(
  pathname: string,
  month?: string
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/dashboard' }
  ]

  // Get the page-specific label
  const pageLabel = BREADCRUMB_CONFIG[pathname]
  if (pageLabel && pathname !== '/dashboard') {
    items.push({
      label: pageLabel,
      href: pathname
    })

    // Add month segment if provided and page supports it
    if (month && ['planung', 'ergebnisse'].some(p => pathname.includes(p))) {
      const monthLabel = formatMonthLabel(month)
      if (monthLabel) {
        items.push({
          label: monthLabel,
          href: `${pathname}?month=${month}`
        })
      }
    }
  }

  return items
}
```

**Step 2: Run TypeScript compiler to verify no errors**

Run:
```bash
npx tsc --noEmit
```

Expected output: No errors, successful compilation

**Step 3: Commit**

```bash
git add lib/config/breadcrumb-config.ts
git commit -m "config: add breadcrumb route configuration and helpers"
```

---

## Task 2: Create Breadcrumb Component

**Files:**
- Create: `components/dashboard/breadcrumb-nav.tsx`

**Step 1: Create the BreadcrumbNav component with full implementation**

Create `components/dashboard/breadcrumb-nav.tsx`:

```typescript
'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { generateBreadcrumbs } from '@/lib/config/breadcrumb-config'
import { cn } from '@/lib/utils'

/**
 * BreadcrumbNav Component
 *
 * Displays navigation breadcrumbs showing the user's current location
 * Example: Home / Monatliche Planung / November 2025
 *
 * Features:
 * - Clickable segments (except last) for quick navigation
 * - Mobile-friendly: shows only current page on small screens
 * - Full dark mode support
 * - Accessible with proper ARIA attributes
 */
export function BreadcrumbNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const month = searchParams.get('month') || undefined

  // Generate breadcrumb items based on current route
  const items = generateBreadcrumbs(pathname, month)

  // Hide breadcrumbs on home page (redundant)
  if (items.length <= 1) {
    return null
  }

  return (
    <nav
      className="mb-6 flex items-center gap-1 flex-wrap"
      aria-label="Breadcrumb Navigation"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={`${item.href}-${index}`} className="flex items-center gap-1">
            {/* Separator (hidden on first item) */}
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-neutral-400 dark:text-neutral-600 flex-shrink-0" />
            )}

            {/* Breadcrumb Item */}
            {isLast ? (
              // Last item: not clickable, bold styling
              <span
                className="text-sm font-semibold text-neutral-900 dark:text-white"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              // Clickable breadcrumb
              <Link
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  'text-blue-600 dark:text-blue-400',
                  'hover:text-blue-700 dark:hover:text-blue-300',
                  'hover:underline',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-neutral-950 rounded px-1'
                )}
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```

Expected output: No errors

**Step 3: Verify component can be imported without errors**

Run:
```bash
grep -r "BreadcrumbNav" components/dashboard/breadcrumb-nav.tsx | head -1
```

Expected output: Shows the export line

**Step 4: Commit**

```bash
git add components/dashboard/breadcrumb-nav.tsx
git commit -m "feat: create BreadcrumbNav component with full styling"
```

---

## Task 3: Add BreadcrumbNav to Dashboard Layout

**Files:**
- Modify: `app/dashboard/layout.tsx`

**Step 1: Read the current layout to understand structure**

Run:
```bash
head -55 app/dashboard/layout.tsx
```

Expected output: Shows the layout structure with DashboardNav and main content

**Step 2: Modify the layout to import and render BreadcrumbNav**

Edit `app/dashboard/layout.tsx` to add breadcrumb import:

Find this line:
```typescript
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
```

Replace with:
```typescript
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { BreadcrumbNav } from '@/components/dashboard/breadcrumb-nav'
```

Then find the main content area:
```typescript
<main className="flex-1 pb-20 md:pb-0 md:ml-64">
  <div className="p-4 md:p-6">
    {children}
  </div>
</main>
```

Replace with:
```typescript
<main className="flex-1 pb-20 md:pb-0 md:ml-64">
  <div className="p-4 md:p-6">
    <BreadcrumbNav />
    {children}
  </div>
</main>
```

**Step 3: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```

Expected output: No errors

**Step 4: Commit**

```bash
git add app/dashboard/layout.tsx
git commit -m "feat: integrate BreadcrumbNav into dashboard layout"
```

---

## Task 4: Create Tests for Breadcrumb Configuration

**Files:**
- Create: `__tests__/lib/config/breadcrumb-config.test.ts`

**Step 1: Create test file for breadcrumb config functions**

Create `__tests__/lib/config/breadcrumb-config.test.ts`:

```typescript
import { generateBreadcrumbs, formatMonthLabel, BREADCRUMB_CONFIG } from '@/lib/config/breadcrumb-config'

describe('Breadcrumb Config', () => {
  describe('formatMonthLabel', () => {
    it('should format month string to German month label', () => {
      const result = formatMonthLabel('2025-11')
      expect(result).toBe('November 2025')
    })

    it('should format January correctly', () => {
      const result = formatMonthLabel('2025-01')
      expect(result).toBe('Januar 2025')
    })

    it('should return empty string for invalid format', () => {
      expect(formatMonthLabel('invalid')).toBe('')
      expect(formatMonthLabel('2025-13')).toBe('')
      expect(formatMonthLabel('25-11')).toBe('')
    })

    it('should handle empty string', () => {
      expect(formatMonthLabel('')).toBe('')
    })
  })

  describe('generateBreadcrumbs', () => {
    it('should return only Home for dashboard root', () => {
      const result = generateBreadcrumbs('/dashboard')
      expect(result).toEqual([{ label: 'Home', href: '/dashboard' }])
    })

    it('should include page for planung route', () => {
      const result = generateBreadcrumbs('/dashboard/planung')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ label: 'Home', href: '/dashboard' })
      expect(result[1]).toEqual({ label: 'Monatliche Planung', href: '/dashboard/planung' })
    })

    it('should include month for planung with month param', () => {
      const result = generateBreadcrumbs('/dashboard/planung', '2025-11')
      expect(result).toHaveLength(3)
      expect(result[2]).toEqual({ label: 'November 2025', href: '/dashboard/planung?month=2025-11' })
    })

    it('should include month for ergebnisse with month param', () => {
      const result = generateBreadcrumbs('/dashboard/ergebnisse', '2025-11')
      expect(result).toHaveLength(3)
      expect(result[1].label).toBe('Monatliche Ergebnisse')
      expect(result[2].label).toBe('November 2025')
    })

    it('should NOT include month for therapien route even with month param', () => {
      const result = generateBreadcrumbs('/dashboard/therapien', '2025-11')
      expect(result).toHaveLength(2)
      expect(result[1].label).toBe('Therapiearten')
    })

    it('should handle all dashboard pages', () => {
      Object.keys(BREADCRUMB_CONFIG).forEach(route => {
        const result = generateBreadcrumbs(route)
        expect(result).toHaveLength(route === '/dashboard' ? 1 : 2)
        if (route !== '/dashboard') {
          expect(result[1].label).toBe(BREADCRUMB_CONFIG[route])
        }
      })
    })
  })

  describe('BREADCRUMB_CONFIG', () => {
    it('should have all required dashboard routes', () => {
      const requiredRoutes = [
        '/dashboard',
        '/dashboard/planung',
        '/dashboard/ergebnisse',
        '/dashboard/therapien',
        '/dashboard/ausgaben',
        '/dashboard/steuerprognose',
        '/dashboard/berichte',
        '/dashboard/einstellungen',
        '/dashboard/analyse',
      ]

      requiredRoutes.forEach(route => {
        expect(BREADCRUMB_CONFIG).toHaveProperty(route)
      })
    })

    it('should have German labels for all routes', () => {
      Object.values(BREADCRUMB_CONFIG).forEach(label => {
        expect(label).toBeTruthy()
        expect(typeof label).toBe('string')
        expect(label.length).toBeGreaterThan(0)
      })
    })
  })
})
```

**Step 2: Run tests to verify they pass**

Run:
```bash
npm test -- __tests__/lib/config/breadcrumb-config.test.ts --no-coverage
```

Expected output: All tests PASS (9 passing)

**Step 3: Commit**

```bash
git add __tests__/lib/config/breadcrumb-config.test.ts
git commit -m "test: add comprehensive tests for breadcrumb configuration"
```

---

## Task 5: Test Breadcrumb Navigation on Dev Server

**Files:**
- Test: `components/dashboard/breadcrumb-nav.tsx` (manual testing)

**Step 1: Start dev server and navigate to each page**

Run:
```bash
npm run dev > /tmp/breadcrumb-test.log 2>&1 &
sleep 10
echo "Dev server started"
```

Expected output: Dev server running on localhost:3000

**Step 2: Test breadcrumbs on dashboard home**

Run:
```bash
curl -s http://localhost:3000/dashboard | grep -c "BreadcrumbNav\|Breadcrumb" || echo "Breadcrumbs rendering"
```

Expected output: Should render without error (200 OK status)

**Step 3: Test breadcrumbs include correct labels**

Run:
```bash
curl -s http://localhost:3000/dashboard/planung | grep -o "Home\|Monatliche Planung" | head -2
```

Expected output:
```
Home
Monatliche Planung
```

**Step 4: Test breadcrumbs with month parameter**

Run:
```bash
curl -s "http://localhost:3000/dashboard/planung?month=2025-11" | grep -o "November 2025" | head -1
```

Expected output:
```
November 2025
```

**Step 5: Verify no TypeScript errors in compiled output**

Run:
```bash
tail -20 /tmp/breadcrumb-test.log | grep -i "error\|warning" || echo "No errors found"
```

Expected output: No TypeScript errors

**Step 6: Test on all dashboard pages**

Run:
```bash
for page in planung ergebnisse therapien ausgaben steuerprognose berichte einstellungen analyse; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/dashboard/$page")
  echo "$page: HTTP $status"
done
```

Expected output: All pages return HTTP 200

**Step 7: Kill dev server**

Run:
```bash
pkill -f "next dev"
```

**Step 8: Commit test results**

```bash
git add -A
git commit -m "test: verify breadcrumb navigation renders on all pages"
```

---

## Task 6: Verify Build Succeeds

**Files:**
- Verify: Build artifacts

**Step 1: Run production build**

Run:
```bash
npm run build 2>&1 | tail -20
```

Expected output:
```
✓ Compiled successfully
✓ Generating static pages (20/20)
```

**Step 2: Check for TypeScript errors in build**

Run:
```bash
npm run build 2>&1 | grep -i "error" | head -5 || echo "No TypeScript errors"
```

Expected output: No TypeScript errors found

**Step 3: Verify bundle size didn't increase significantly**

Run:
```bash
npm run build 2>&1 | grep "dashboard" | head -3
```

Expected output: Should show dashboard route size (should be reasonable, ~8-10kB)

**Step 4: Commit**

```bash
git add -A
git commit -m "ci: verify Phase 1 breadcrumb implementation builds successfully"
```

---

## Task 7: Manual Testing Checklist

**Files:**
- Test: All dashboard pages

**Step 1: Start dev server**

Run:
```bash
npm run dev > /tmp/final-test.log 2>&1 &
sleep 10
```

**Step 2: Test breadcrumbs on desktop (1440px)**

- [ ] Navigate to `/dashboard/planung?month=2025-11`
- [ ] Verify breadcrumb shows: `Home / Monatliche Planung / November 2025`
- [ ] Click "Monatliche Planung" - should navigate to `/dashboard/planung`
- [ ] Click "Home" - should navigate to `/dashboard`
- [ ] Verify breadcrumbs appear above main content

**Step 3: Test breadcrumbs on mobile (375px)**

- [ ] Open dev tools, set viewport to 375px
- [ ] Navigate to `/dashboard/ergebnisse?month=2025-11`
- [ ] Verify breadcrumbs visible and readable
- [ ] Test on at least 2 different pages

**Step 4: Test dark mode**

- [ ] Open dev tools (F12)
- [ ] Toggle dark mode (click sidebar "Dunkles Design")
- [ ] Verify breadcrumbs colors update:
  - Links: blue-400 (dark mode)
  - Separators: neutral-600 (dark mode)
  - Current page: white text (dark mode)

**Step 5: Test keyboard navigation**

- [ ] Press Tab to navigate to breadcrumb links
- [ ] Verify focus ring appears (visible outline)
- [ ] Press Enter to navigate via breadcrumb
- [ ] Verify page navigates correctly

**Step 6: Test on all pages**

For each page below, verify:
1. Breadcrumb renders correctly
2. Correct labels shown
3. Links navigate properly

Pages to test:
- [ ] /dashboard (should show only "Home")
- [ ] /dashboard/planung
- [ ] /dashboard/ergebnisse
- [ ] /dashboard/therapien
- [ ] /dashboard/ausgaben
- [ ] /dashboard/steuerprognose
- [ ] /dashboard/berichte
- [ ] /dashboard/einstellungen
- [ ] /dashboard/analyse

**Step 7: Kill dev server**

Run:
```bash
pkill -f "next dev"
```

**Step 8: Document results and commit**

Run:
```bash
git add -A
git commit -m "test: complete manual testing of breadcrumb navigation on all pages"
```

---

## Task 8: Create Breadcrumb Snapshot Tests (Optional but Recommended)

**Files:**
- Create: `__tests__/components/dashboard/breadcrumb-nav.test.tsx`

**Step 1: Create snapshot tests for BreadcrumbNav component**

Create `__tests__/components/dashboard/breadcrumb-nav.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { BreadcrumbNav } from '@/components/dashboard/breadcrumb-nav'

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}))

import { usePathname, useSearchParams } from 'next/navigation'

describe('BreadcrumbNav Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render on dashboard root', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    const { container } = render(<BreadcrumbNav />)
    expect(container.firstChild).toBeNull()
  })

  it('should render breadcrumbs for planung page', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard/planung')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    render(<BreadcrumbNav />)

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Monatliche Planung')).toBeInTheDocument()
  })

  it('should render breadcrumbs with month for planung page', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard/planung')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('month=2025-11'))

    render(<BreadcrumbNav />)

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Monatliche Planung')).toBeInTheDocument()
    expect(screen.getByText('November 2025')).toBeInTheDocument()
  })

  it('should mark last breadcrumb as current page', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard/ergebnisse')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    render(<BreadcrumbNav />)

    const lastItem = screen.getByText('Monatliche Ergebnisse')
    expect(lastItem).toHaveAttribute('aria-current', 'page')
  })

  it('should have correct href on navigation links', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard/therapien')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    render(<BreadcrumbNav />)

    const homeLink = screen.getByText('Home')
    expect(homeLink.closest('a')).toHaveAttribute('href', '/dashboard')
  })
})
```

**Step 2: Run snapshot tests**

Run:
```bash
npm test -- __tests__/components/dashboard/breadcrumb-nav.test.tsx --no-coverage
```

Expected output: Tests should pass (6 passing)

**Step 3: Commit**

```bash
git add __tests__/components/dashboard/breadcrumb-nav.test.tsx
git commit -m "test: add component tests for BreadcrumbNav"
```

---

## Summary: Phase 1 Complete

✅ **Breadcrumb Configuration** - Created route-to-label mapping
✅ **BreadcrumbNav Component** - Fully styled with dark mode
✅ **Dashboard Integration** - Added to layout for all pages
✅ **Configuration Tests** - 9 passing tests
✅ **Component Tests** - 6 passing tests
✅ **Manual Testing** - Verified on all pages and breakpoints
✅ **Production Build** - Verified build succeeds

**Deliverables:**
- 1 new configuration file (`breadcrumb-config.ts`)
- 1 new component (`breadcrumb-nav.tsx`)
- 1 modified layout file (`app/dashboard/layout.tsx`)
- 15+ passing unit tests
- All pages show correct breadcrumbs
- Full dark mode support
- Keyboard accessible

---

## Git Log (Phase 1)

Expected commits after completion:
```
config: add breadcrumb route configuration and helpers
feat: create BreadcrumbNav component with full styling
feat: integrate BreadcrumbNav into dashboard layout
test: add comprehensive tests for breadcrumb configuration
test: verify breadcrumb navigation renders on all pages
ci: verify Phase 1 breadcrumb implementation builds successfully
test: complete manual testing of breadcrumb navigation on all pages
test: add component tests for BreadcrumbNav
```

---

## Next Steps: Phase 2

After Phase 1 is complete, Phase 2 will implement the **Related Pages Component** following the same approach:

1. Create page relationships configuration
2. Build RelatedPages component with styling
3. Add to all dashboard pages
4. Test thoroughly
5. Build and verify

See `docs/plans/2025-11-29-navigation-ui-ux-design.md` for complete Phase 2-4 specifications.
