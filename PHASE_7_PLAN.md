# Phase 7 Implementation Plan
## Testing, Quality Assurance & Component Documentation

**Date:** November 13, 2025
**Scope:** E2E testing, component documentation, visual regression testing, performance optimization

---

## 🎯 Phase 7 Goals

1. **Implement E2E Tests** - Test critical user journeys with Playwright
2. **Setup Storybook** - Document and showcase all UI components
3. **Visual Regression Testing** - Catch unintended design changes
4. **Performance Audit** - Verify Core Web Vitals and optimization
5. **Accessibility Testing** - Ensure WCAG compliance

---

## 🧪 E2E Testing with Playwright

### Setup
```bash
npm install -D @playwright/test
npm install -D @testing-library/react @testing-library/jest-dom
```

### Test Files to Create
```
e2e/
├── auth.spec.ts              # Authentication flows
├── therapy-management.spec.ts # CRUD operations
├── monthly-planning.spec.ts    # Planning features
├── break-even-analysis.spec.ts # Analysis calculations
├── reporting.spec.ts           # Report generation
└── dashboard.spec.ts           # Dashboard functionality
```

### Test Coverage Areas

#### 1. Authentication Tests
```typescript
// e2e/auth.spec.ts
- User signup flow
- Email verification
- Login with valid credentials
- Login with invalid credentials
- Logout functionality
- Password reset flow
- Session persistence
- Protected route redirection
```

#### 2. Therapy Management Tests
```typescript
// e2e/therapy-management.spec.ts
- Create new therapy type
- Edit existing therapy
- Delete therapy with confirmation
- Table sorting and filtering
- Form validation (required fields)
- Duplicate prevention
- Bulk operations
- Error handling for invalid input
```

#### 3. Monthly Planning Tests
```typescript
// e2e/monthly-planning.spec.ts
- Create monthly plan
- Update planned sessions
- Revenue calculation accuracy
- Copy from previous month
- Month selector navigation
- Data persistence
- Form validation
- Concurrent editing
```

#### 4. Break-Even Analysis Tests
```typescript
// e2e/break-even-analysis.spec.ts
- Load break-even data
- Adjust fixed costs
- Sensitivity analysis scenarios
- Chart rendering
- Data export (CSV, JSON, HTML)
- Print functionality
- Historical data display
- Trend analysis
```

#### 5. Reporting Tests
```typescript
// e2e/reporting.spec.ts
- Generate therapy performance report
- Generate financial summary report
- Generate operational report
- Generate forecast report
- Export all formats
- Email report functionality
- Schedule report generation
- Archive reports
```

#### 6. Dashboard Tests
```typescript
// e2e/dashboard.spec.ts
- KPI cards load with data
- Trend indicators display correctly
- Navigation between sections
- Dark/light mode toggle
- Responsive layout on mobile
- Data refresh functionality
- Error state handling
- Loading states
```

### Example Test Structure
```typescript
import { test, expect } from '@playwright/test'

test.describe('Therapy Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button:has-text("Login")')
    await page.waitForNavigation()
  })

  test('should create new therapy type', async ({ page }) => {
    await page.goto('/dashboard/therapien')
    await page.click('button:has-text("Neue Therapieart")')

    // Fill form
    await page.fill('input[name="name"]', 'Physiotherapie')
    await page.fill('input[name="price_per_session"]', '60')
    await page.fill('input[name="variable_cost_per_session"]', '15')

    // Submit
    await page.click('button:has-text("Speichern")')

    // Verify
    await expect(page.locator('text=Physiotherapie')).toBeVisible()
  })

  test('should delete therapy with confirmation', async ({ page }) => {
    await page.goto('/dashboard/therapien')

    // Click delete button
    await page.click('button[aria-label="Delete"]')

    // Confirm dialog
    await expect(page.locator('text=Therapieart löschen?')).toBeVisible()
    await page.click('button:has-text("Löschen")')

    // Verify deletion
    await expect(page.locator('text=Therapie erfolgreich gelöscht')).toBeVisible()
  })
})
```

### CI Integration
```yaml
# .github/workflows/test.yml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## 📚 Storybook Setup

### Installation
```bash
npx storybook@latest init --type react
npm install -D storybook @storybook/react @storybook/addon-essentials
```

### Component Stories to Create
```
src/stories/
├── ui/
│   ├── Button.stories.tsx
│   ├── Card.stories.tsx
│   ├── Dialog.stories.tsx
│   ├── TextField.stories.tsx
│   ├── NumberField.stories.tsx
│   ├── SelectField.stories.tsx
│   ├── ConfirmDialog.stories.tsx
│   ├── EmptyState.stories.tsx
│   ├── Table.stories.tsx
│   ├── Input.stories.tsx
│   ├── Label.stories.tsx
│   └── Skeleton.stories.tsx
├── dashboard/
│   ├── KpiCard.stories.tsx
│   ├── PlannerCard.stories.tsx
│   ├── TherapyTable.stories.tsx
│   ├── BreakEvenChart.stories.tsx
│   └── DashboardNav.stories.tsx
└── pages/
    ├── Dashboard.stories.tsx
    ├── TherapyManagement.stories.tsx
    └── Reports.stories.tsx
```

### Example Story
```typescript
// src/stories/ui/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/button'

const meta = {
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Click me',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'default',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'outline',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const WithIcon: Story = {
  render: (args) => (
    <Button {...args}>
      <CheckCircle className="mr-2 h-4 w-4" />
      Speichern
    </Button>
  ),
}
```

---

## 🎨 Visual Regression Testing

### Setup with Playwright
```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test('Dashboard page visual regression', async ({ page }) => {
    await page.goto('/dashboard')

    // Take screenshot and compare
    await expect(page).toHaveScreenshot('dashboard-light.png')

    // Test dark mode
    await page.click('[data-testid="theme-toggle"]')
    await expect(page).toHaveScreenshot('dashboard-dark.png')
  })

  test('Therapy management page visual regression', async ({ page }) => {
    await page.goto('/dashboard/therapien')
    await expect(page).toHaveScreenshot('therapies.png')
  })

  test('Reports page visual regression', async ({ page }) => {
    await page.goto('/dashboard/berichte')
    await expect(page).toHaveScreenshot('reports.png')
  })
})
```

### Visual Regression in CI
```bash
# Update baseline images
npx playwright test --update-snapshots

# Compare in CI (fails if differences detected)
npx playwright test
```

---

## ⚡ Performance Audit

### Core Web Vitals Testing
```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test'

test('Dashboard Core Web Vitals', async ({ page }) => {
  const metrics = await page.evaluate(() => {
    const getCLS = () => {
      let clsValue = 0
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
      }).observe({ type: 'layout-shift', buffered: true })
      return clsValue
    }

    return {
      cls: getCLS(),
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      lcp: 0, // Would be captured by observer
    }
  })

  expect(metrics.cls).toBeLessThan(0.1) // CLS < 0.1
  expect(metrics.fcp).toBeLessThan(1800) // FCP < 1.8s
})
```

### Lighthouse Integration
```bash
npm install -D @lhci/cli@latest @lhci/config
npx lhci autorun
```

---

## ♿ Accessibility Testing

### Axe Testing Integration
```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test('Dashboard accessibility', async ({ page }) => {
  await page.goto('/dashboard')
  await injectAxe(page)
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: {
      html: true,
    },
  })
})
```

### Manual Accessibility Checks
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader compatibility
- [ ] Color contrast compliance
- [ ] Focus indicators visible
- [ ] Form labels properly associated
- [ ] ARIA attributes correct
- [ ] Error messages clear
- [ ] Mobile touch targets (48px+)

---

## 📊 Test Coverage Goals

### Target Coverage Metrics
- **Line Coverage:** 80%+
- **Branch Coverage:** 75%+
- **Function Coverage:** 80%+
- **Statement Coverage:** 80%+

### Critical Paths (100% coverage)
- Authentication flows
- Data calculations (KPIs, break-even)
- Form validation
- Error handling
- Data persistence

---

## 🚀 Phase 7 Checklist

### Week 1: E2E Testing Setup
- [ ] Install Playwright and dependencies
- [ ] Create test file structure
- [ ] Write authentication tests
- [ ] Write therapy management tests
- [ ] Setup CI workflow for tests
- [ ] Document test patterns

### Week 2: Advanced E2E Tests
- [ ] Write monthly planning tests
- [ ] Write break-even analysis tests
- [ ] Write reporting tests
- [ ] Write dashboard tests
- [ ] Test cross-browser compatibility
- [ ] Performance baseline tests

### Week 3: Storybook Setup
- [ ] Initialize Storybook
- [ ] Create UI component stories
- [ ] Create dashboard component stories
- [ ] Create page-level stories
- [ ] Setup visual testing addon
- [ ] Document component usage

### Week 4: Visual & Accessibility Testing
- [ ] Setup visual regression testing
- [ ] Create baseline screenshots
- [ ] Setup accessibility testing
- [ ] Run Axe audits on all pages
- [ ] Performance audit with Lighthouse
- [ ] Create test report documentation

---

## 📈 Success Metrics

- ✅ All critical user flows covered by E2E tests
- ✅ 80%+ code coverage
- ✅ All components documented in Storybook
- ✅ Zero accessibility violations
- ✅ Core Web Vitals passing (LCP < 2.5s, CLS < 0.1)
- ✅ Lighthouse score > 90
- ✅ All tests pass in CI/CD pipeline
- ✅ Visual regressions caught and reviewed

---

## 📚 References

- [Playwright Documentation](https://playwright.dev)
- [Storybook Documentation](https://storybook.js.org)
- [Axe Accessibility Testing](https://www.deque.com/axe)
- [Lighthouse Guide](https://developers.google.com/web/tools/lighthouse)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref)

---

**Next Phase:** Phase 8 - Production Deployment & DevOps
**Timeline:** 2-3 weeks for comprehensive Phase 7 completion
**Status:** Ready to begin when approved

---

*Implementation Plan for Phase 7*
*November 13, 2025*
