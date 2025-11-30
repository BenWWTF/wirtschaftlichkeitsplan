# Phase 2 Implementation Plan: Related Pages Component

**Date:** November 30, 2025
**Phase:** 2 of 4 (UI/UX Improvement Project)
**Goals:**
- Create RelatedPages component for page relationship discovery
- Configure page relationships for all 8 dashboard pages
- Integrate into all dashboard pages at the bottom
- Verify responsive layout and dark mode support

---

## Overview

The Related Pages component shows users connected pages at the bottom of each dashboard page. This helps users understand how pages relate to each other and discover features they might not find otherwise.

**Component Structure:**
```
Related Pages Grid:
├─ Card 1: Page Icon + Title + Description + Arrow
├─ Card 2: Page Icon + Title + Description + Arrow
├─ Card 3: Page Icon + Title + Description + Arrow
└─ Card 4: Page Icon + Title + Description + Arrow
```

**Grid Behavior:**
- Mobile (< 768px): 1 column
- Tablet (768px-1024px): 2 columns
- Desktop (> 1024px): 3 columns
- Maximum 4 cards per page

---

## Task 1: Create Page Relationships Configuration

**Files:**
- Create: `lib/config/page-relationships.ts`

**Step 1: Create the configuration file**

Create `lib/config/page-relationships.ts`:

```typescript
import { Home, Calendar, BarChart3, Pill, Receipt, Calculator, FileText, Settings, TrendingUp } from 'lucide-react'

export interface PageRelationship {
  title: string
  description: string
  href: string
  icon: React.ReactNode
}

export interface PageRelationships {
  [page: string]: PageRelationship[]
}

// Icon map for pages
const PAGE_ICONS = {
  '/dashboard': <Home className="w-6 h-6" />,
  '/dashboard/planung': <Calendar className="w-6 h-6" />,
  '/dashboard/ergebnisse': <BarChart3 className="w-6 h-6" />,
  '/dashboard/therapien': <Pill className="w-6 h-6" />,
  '/dashboard/ausgaben': <Receipt className="w-6 h-6" />,
  '/dashboard/steuerprognose': <Calculator className="w-6 h-6" />,
  '/dashboard/berichte': <FileText className="w-6 h-6" />,
  '/dashboard/einstellungen': <Settings className="w-6 h-6" />,
  '/dashboard/analyse': <TrendingUp className="w-6 h-6" />,
}

export const PAGE_RELATIONSHIPS: PageRelationships = {
  '/dashboard/planung': [
    {
      title: 'Monatliche Ergebnisse',
      description: 'See actual vs planned sessions for this month',
      href: '/dashboard/ergebnisse',
      icon: PAGE_ICONS['/dashboard/ergebnisse'],
    },
    {
      title: 'Therapiearten',
      description: 'Manage therapy types and pricing',
      href: '/dashboard/therapien',
      icon: PAGE_ICONS['/dashboard/therapien'],
    },
    {
      title: 'Ausgaben',
      description: 'Track fixed and variable costs',
      href: '/dashboard/ausgaben',
      icon: PAGE_ICONS['/dashboard/ausgaben'],
    },
  ],
  '/dashboard/ergebnisse': [
    {
      title: 'Monatliche Planung',
      description: 'Plan sessions and revenue targets',
      href: '/dashboard/planung',
      icon: PAGE_ICONS['/dashboard/planung'],
    },
    {
      title: 'Ausgaben',
      description: 'Review costs and their impact',
      href: '/dashboard/ausgaben',
      icon: PAGE_ICONS['/dashboard/ausgaben'],
    },
    {
      title: 'Analyse',
      description: 'Deep dive into metrics and trends',
      href: '/dashboard/analyse',
      icon: PAGE_ICONS['/dashboard/analyse'],
    },
  ],
  '/dashboard/therapien': [
    {
      title: 'Monatliche Planung',
      description: 'Use these therapy types in your plan',
      href: '/dashboard/planung',
      icon: PAGE_ICONS['/dashboard/planung'],
    },
    {
      title: 'Ausgaben',
      description: 'View costs associated with each type',
      href: '/dashboard/ausgaben',
      icon: PAGE_ICONS['/dashboard/ausgaben'],
    },
    {
      title: 'Einstellungen',
      description: 'Configure default pricing and settings',
      href: '/dashboard/einstellungen',
      icon: PAGE_ICONS['/dashboard/einstellungen'],
    },
  ],
  '/dashboard/ausgaben': [
    {
      title: 'Monatliche Planung',
      description: 'See impact of costs on profitability',
      href: '/dashboard/planung',
      icon: PAGE_ICONS['/dashboard/planung'],
    },
    {
      title: 'Monatliche Ergebnisse',
      description: 'Compare planned vs actual costs',
      href: '/dashboard/ergebnisse',
      icon: PAGE_ICONS['/dashboard/ergebnisse'],
    },
    {
      title: 'Meine Steuerprognose',
      description: 'See tax impact of your expenses',
      href: '/dashboard/steuerprognose',
      icon: PAGE_ICONS['/dashboard/steuerprognose'],
    },
  ],
  '/dashboard/steuerprognose': [
    {
      title: 'Analyse',
      description: 'Understand your financial trends',
      href: '/dashboard/analyse',
      icon: PAGE_ICONS['/dashboard/analyse'],
    },
    {
      title: 'Ausgaben',
      description: 'Adjust costs to optimize taxes',
      href: '/dashboard/ausgaben',
      icon: PAGE_ICONS['/dashboard/ausgaben'],
    },
    {
      title: 'Einstellungen',
      description: 'Configure tax-related settings',
      href: '/dashboard/einstellungen',
      icon: PAGE_ICONS['/dashboard/einstellungen'],
    },
  ],
  '/dashboard/analyse': [
    {
      title: 'Meine Steuerprognose',
      description: 'See your tax forecast',
      href: '/dashboard/steuerprognose',
      icon: PAGE_ICONS['/dashboard/steuerprognose'],
    },
    {
      title: 'Monatliche Planung',
      description: 'Plan based on insights',
      href: '/dashboard/planung',
      icon: PAGE_ICONS['/dashboard/planung'],
    },
    {
      title: 'Monatliche Ergebnisse',
      description: 'Review execution results',
      href: '/dashboard/ergebnisse',
      icon: PAGE_ICONS['/dashboard/ergebnisse'],
    },
  ],
  '/dashboard/berichte': [
    {
      title: 'Analyse',
      description: 'See detailed analytics and trends',
      href: '/dashboard/analyse',
      icon: PAGE_ICONS['/dashboard/analyse'],
    },
    {
      title: 'Monatliche Ergebnisse',
      description: 'Review monthly performance',
      href: '/dashboard/ergebnisse',
      icon: PAGE_ICONS['/dashboard/ergebnisse'],
    },
    {
      title: 'Meine Steuerprognose',
      description: 'Check your tax forecast',
      href: '/dashboard/steuerprognose',
      icon: PAGE_ICONS['/dashboard/steuerprognose'],
    },
  ],
  '/dashboard/einstellungen': [
    {
      title: 'Therapiearten',
      description: 'Manage therapy offerings',
      href: '/dashboard/therapien',
      icon: PAGE_ICONS['/dashboard/therapien'],
    },
    {
      title: 'Ausgaben',
      description: 'Configure fixed and variable costs',
      href: '/dashboard/ausgaben',
      icon: PAGE_ICONS['/dashboard/ausgaben'],
    },
    {
      title: 'Monatliche Planung',
      description: 'Return to planning',
      href: '/dashboard/planung',
      icon: PAGE_ICONS['/dashboard/planung'],
    },
  ],
}

export function getRelatedPages(currentPage: string, limit: number = 4): PageRelationship[] {
  const relationships = PAGE_RELATIONSHIPS[currentPage] || []
  return relationships.slice(0, limit)
}
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```

Expected output: No errors

**Step 3: Commit**

```bash
git add lib/config/page-relationships.ts
git commit -m "config: add page relationships configuration with icons"
```

---

## Task 2: Create RelatedPages Component

**Files:**
- Create: `components/dashboard/related-pages.tsx`

**Step 1: Create the RelatedPages component**

Create `components/dashboard/related-pages.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getRelatedPages } from '@/lib/config/page-relationships'
import { cn } from '@/lib/utils'

interface RelatedPagesProps {
  currentPage: string
  limit?: number
}

/**
 * RelatedPages Component
 *
 * Displays cards showing related pages to help users discover connections
 * between different dashboard pages.
 *
 * Features:
 * - Responsive grid (1/2/3 columns based on breakpoint)
 * - Card hover effects with shadow lift
 * - Icon + title + description + navigation arrow
 * - Full dark mode support
 * - Accessible with proper keyboard navigation
 */
export function RelatedPages({ currentPage, limit = 4 }: RelatedPagesProps) {
  const relatedPages = getRelatedPages(currentPage, limit)

  if (relatedPages.length === 0) {
    return null
  }

  return (
    <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-700">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
        Related Pages
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {relatedPages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className={cn(
              'group rounded-lg border border-neutral-200 dark:border-neutral-700',
              'bg-white dark:bg-neutral-800',
              'p-4 md:p-6',
              'hover:shadow-md dark:hover:shadow-lg',
              'transition-shadow duration-200',
              'flex flex-col gap-3'
            )}
          >
            {/* Icon and Title Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-6 h-6 text-accent-600 dark:text-accent-400">
                  {page.icon}
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white text-sm md:text-base group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                  {page.title}
                </h3>
              </div>
              <ChevronRight className="flex-shrink-0 w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors" />
            </div>

            {/* Description */}
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {page.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```

Expected output: No errors

**Step 3: Verify component can be imported**

Run:
```bash
grep -r "RelatedPages" components/dashboard/related-pages.tsx | head -1
```

Expected output: Shows the export line

**Step 4: Commit**

```bash
git add components/dashboard/related-pages.tsx
git commit -m "feat: create RelatedPages component with responsive grid layout"
```

---

## Task 3: Add RelatedPages to Planung Page

**Files:**
- Modify: `app/dashboard/planung/page.tsx`

**Step 1: Read the current page to understand structure**

Run:
```bash
head -50 app/dashboard/planung/page.tsx
```

**Step 2: Add RelatedPages import and usage**

Find this import section:
```typescript
import { ... other imports ... }
```

Add:
```typescript
import { RelatedPages } from '@/components/dashboard/related-pages'
```

Then find the main return statement and add RelatedPages at the end, before the closing main tag:
```typescript
<RelatedPages currentPage="/dashboard/planung" />
```

**Step 3: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```

Expected output: No errors

**Step 4: Commit**

```bash
git add app/dashboard/planung/page.tsx
git commit -m "feat: add RelatedPages to planung page"
```

---

## Task 4: Add RelatedPages to Remaining 6 Pages

**Files:**
- Modify: `app/dashboard/ergebnisse/page.tsx`
- Modify: `app/dashboard/therapien/page.tsx`
- Modify: `app/dashboard/ausgaben/page.tsx`
- Modify: `app/dashboard/steuerprognose/page.tsx`
- Modify: `app/dashboard/berichte/page.tsx`
- Modify: `app/dashboard/einstellungen/page.tsx`

**For each page:**

1. Add import:
```typescript
import { RelatedPages } from '@/components/dashboard/related-pages'
```

2. Add at end of main content:
```typescript
<RelatedPages currentPage="/dashboard/{page-name}" />
```

3. Verify no TypeScript errors after each change

**Pages to update:**
- `/dashboard/ergebnisse` → `currentPage="/dashboard/ergebnisse"`
- `/dashboard/therapien` → `currentPage="/dashboard/therapien"`
- `/dashboard/ausgaben` → `currentPage="/dashboard/ausgaben"`
- `/dashboard/steuerprognose` → `currentPage="/dashboard/steuerprognose"`
- `/dashboard/berichte` → `currentPage="/dashboard/berichte"`
- `/dashboard/einstellungen` → `currentPage="/dashboard/einstellungen"`

**Commit after all pages are updated:**

```bash
git add app/dashboard/*/page.tsx
git commit -m "feat: add RelatedPages to all remaining dashboard pages"
```

---

## Task 5: Test RelatedPages on Dev Server

**Files:**
- Test: All RelatedPages components (manual testing)

**Step 1: Start dev server**

Run:
```bash
npm run dev > /tmp/related-pages-test.log 2>&1 &
sleep 12
echo "Dev server started"
```

**Step 2: Test RelatedPages rendering on planung**

Run:
```bash
curl -s http://localhost:3002/dashboard/planung | grep -o "Related Pages\|Monatliche Ergebnisse" | head -3
```

Expected output:
```
Related Pages
Monatliche Ergebnisse
```

**Step 3: Test RelatedPages on all pages**

For each page, verify the correct related pages appear:

```bash
for page in planung ergebnisse therapien ausgaben steuerprognose berichte einstellungen; do
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002/dashboard/$page")
  echo "✓ /dashboard/$page: HTTP $http_code"
done
```

Expected output: All pages return HTTP 200

**Step 4: Check for TypeScript errors in dev server**

Run:
```bash
tail -30 /tmp/related-pages-test.log | grep -i "error\|Error" || echo "No errors found"
```

Expected output: No TypeScript errors

**Step 5: Kill dev server**

Run:
```bash
pkill -f "next dev"
sleep 2
echo "Dev server stopped"
```

**Step 6: Commit test results**

```bash
git add -A
git commit -m "test: verify RelatedPages renders on all dashboard pages"
```

---

## Task 6: Verify Production Build Succeeds

**Files:**
- Verify: Build artifacts

**Step 1: Run production build**

Run:
```bash
npm run build 2>&1 | tail -50
```

Expected output: Build completes successfully with all routes compiled

**Step 2: Check for TypeScript errors**

Run:
```bash
npm run build 2>&1 | grep "error:" | head -5 || echo "No TypeScript errors"
```

Expected output: No TypeScript errors

**Step 3: Verify bundle size didn't increase significantly**

Run:
```bash
npm run build 2>&1 | grep "dashboard" | head -3
```

Expected output: Should show dashboard route sizes (should remain ~150kB per page)

**Step 4: Commit**

```bash
git add -A
git commit -m "ci: verify Phase 2 RelatedPages build succeeds"
```

---

## Task 7: Manual Testing Checklist

**Files:**
- Test: All dashboard pages

**Step 1: Start dev server**

Run:
```bash
npm run dev > /tmp/manual-test.log 2>&1 &
sleep 12
```

**Step 2: Test Related Pages on Desktop (1440px)**

Manual testing checklist:
- [ ] Navigate to `/dashboard/planung`
- [ ] Verify RelatedPages section appears at bottom
- [ ] Verify 3 related page cards show in grid
- [ ] Click "Monatliche Ergebnisse" card - should navigate to ergebnisse
- [ ] Verify cards show icon + title + description + arrow
- [ ] Verify cards are readable and well-spaced

**Step 3: Test Related Pages on Mobile (375px)**

- [ ] Open dev tools, set viewport to 375px
- [ ] Navigate to `/dashboard/ergebnisse`
- [ ] Verify RelatedPages section appears
- [ ] Verify only 1 card per row (responsive 1 column)
- [ ] Verify cards are touchable (44px+ height)
- [ ] Click a card - should navigate correctly

**Step 4: Test Related Pages on Tablet (768px)**

- [ ] Set viewport to 768px
- [ ] Navigate to `/dashboard/therapien`
- [ ] Verify 2 cards per row (responsive 2 columns)
- [ ] Verify spacing looks correct

**Step 5: Test Dark Mode**

- [ ] Open dev tools (F12)
- [ ] Toggle dark mode (click sidebar "Dunkles Design")
- [ ] Verify card colors update:
  - Cards: neutral-800 background (dark mode)
  - Text: white text (dark mode)
  - Hover: shadow increases (dark mode)
  - Border: neutral-700 (dark mode)

**Step 6: Test on All Pages**

For each page below, verify:
1. RelatedPages section appears
2. Correct 3-4 related cards show
3. All cards are clickable
4. Navigation works correctly

Pages to test:
- [ ] /dashboard/planung
- [ ] /dashboard/ergebnisse
- [ ] /dashboard/therapien
- [ ] /dashboard/ausgaben
- [ ] /dashboard/steuerprognose
- [ ] /dashboard/berichte
- [ ] /dashboard/einstellungen

**Step 7: Kill dev server**

Run:
```bash
pkill -f "next dev"
sleep 2
```

**Step 8: Commit results**

```bash
git add -A
git commit -m "test: manual testing of RelatedPages on all pages and breakpoints"
```

---

## Task 8: Create Component Tests for RelatedPages (Optional but Recommended)

**Files:**
- Create: `__tests__/components/dashboard/related-pages.test.tsx`

**Step 1: Create test file**

Create `__tests__/components/dashboard/related-pages.test.tsx`:

```typescript
/// <reference types="jest" />
import { render, screen } from '@testing-library/react'
import { RelatedPages } from '@/components/dashboard/related-pages'

describe('RelatedPages Component', () => {
  it('should render related pages for planung', () => {
    render(<RelatedPages currentPage="/dashboard/planung" />)

    expect(screen.getByText('Related Pages')).toBeInTheDocument()
    expect(screen.getByText('Monatliche Ergebnisse')).toBeInTheDocument()
    expect(screen.getByText('Therapiearten')).toBeInTheDocument()
    expect(screen.getByText('Ausgaben')).toBeInTheDocument()
  })

  it('should render different pages for ergebnisse', () => {
    render(<RelatedPages currentPage="/dashboard/ergebnisse" />)

    expect(screen.getByText('Related Pages')).toBeInTheDocument()
    expect(screen.getByText('Monatliche Planung')).toBeInTheDocument()
    expect(screen.getByText('Analyse')).toBeInTheDocument()
  })

  it('should render nothing for unknown page', () => {
    const { container } = render(<RelatedPages currentPage="/unknown" />)
    expect(container.firstChild).toBeNull()
  })

  it('should respect limit prop', () => {
    const { container } = render(
      <RelatedPages currentPage="/dashboard/planung" limit={2} />
    )
    const cards = container.querySelectorAll('a')
    expect(cards.length).toBe(2)
  })

  it('should have correct navigation links', () => {
    render(<RelatedPages currentPage="/dashboard/planung" />)

    const ergebnisseLink = screen.getByText('Monatliche Ergebnisse').closest('a')
    expect(ergebnisseLink).toHaveAttribute('href', '/dashboard/ergebnisse')
  })
})
```

**Step 2: Commit tests**

```bash
git add __tests__/components/dashboard/related-pages.test.tsx
git commit -m "test: add component tests for RelatedPages"
```

---

## Summary: Phase 2 Complete

✅ **Page Relationships Configuration** - All 8 pages mapped with descriptions
✅ **RelatedPages Component** - Fully styled with responsive grid and dark mode
✅ **Integration to All Pages** - Added to bottom of 7 main dashboard pages
✅ **Dev Server Testing** - Verified rendering on all pages
✅ **Production Build** - Verified build succeeds with 0 TypeScript errors
✅ **Manual Testing** - Verified on desktop, tablet, mobile, and dark mode
✅ **Component Tests** - 5 passing tests for RelatedPages

### Deliverables

- 1 new configuration file (`page-relationships.ts`)
- 1 new component (`related-pages.tsx`)
- 7 modified page files (added RelatedPages integration)
- 5+ passing component tests
- All pages show correct related pages
- Full dark mode support
- Keyboard accessible

### Git Log (Phase 2)

Expected commits:
```
config: add page relationships configuration with icons
feat: create RelatedPages component with responsive grid layout
feat: add RelatedPages to all remaining dashboard pages
test: verify RelatedPages renders on all dashboard pages
ci: verify Phase 2 RelatedPages build succeeds
test: manual testing of RelatedPages on all pages and breakpoints
test: add component tests for RelatedPages
```

---

## Next Steps: Phase 3

After Phase 2 completion, Phase 3 will implement:
- **Consistency & Polish Layer**
- Standardize card styling across all components
- Standardize button styles
- Standardize form elements
- Typography audit
- Spacing audit

See `docs/plans/2025-11-29-navigation-ui-ux-design.md` for Phase 3 specifications.
