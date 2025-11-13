# E2E Testing Documentation

## Overview

This document describes the end-to-end (E2E) testing setup for the wirtschaftlichkeitsplan application using Playwright. The E2E tests validate core user workflows across multiple browsers and device types.

## Installation

Playwright has been installed as a dev dependency:

```bash
pnpm add -D @playwright/test
```

## Configuration

The E2E testing is configured in `playwright.config.ts` with the following features:

- **Multiple Browsers**: Chromium, Firefox, and WebKit
- **Device Testing**: Desktop (all browsers), Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
- **Parallel Execution**: Tests run in parallel for faster feedback
- **Artifacts**: Screenshots, videos, and traces captured on failures
- **Reporter**: HTML report generated after test runs

### Configuration Details

```typescript
{
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  retries: 2 (CI only),
  reporters: 'html',
  baseURL: 'http://localhost:3000',
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

## Test Files

### 1. **dashboard-navigation.spec.ts** (16 tests)

Tests the fundamental dashboard navigation and accessibility:

- Load dashboard and display main sections
- Display dashboard navigation menu
- Responsive behavior (mobile, tablet, desktop)
- Accessible heading structure
- Keyboard navigation (Tab key)
- JavaScript error detection

**Coverage**: Navigation, accessibility, responsiveness, error handling

### 2. **break-even-analysis.spec.ts** (9 tests)

Tests the break-even analysis workflow:

- Navigate to break-even analysis page
- Display therapy configuration section
- Allow adding therapy types
- Display KPI metrics and calculations
- Handle form inputs for therapy configuration
- Display break-even calculations
- Responsive design during analysis input
- State persistence across navigation
- Error message display for invalid input

**Coverage**: Form handling, data persistence, calculations, user interactions

### 3. **kpi-dashboard.spec.ts** (14 tests)

Tests the KPI dashboard functionality:

- Display KPI dashboard with main metrics
- Display revenue metrics
- Display occupancy rate metrics
- Display profitability status
- Render charts/visualizations
- Display numeric values in KPI cards
- Color contrast for accessibility
- Dark mode toggle support
- KPI data loading performance (< 5 seconds)
- Metric updates when data changes
- Responsive across all viewport sizes
- Accessible labels for all metrics
- Keyboard navigation of metrics

**Coverage**: Dashboard rendering, metrics display, performance, accessibility, responsiveness

### 4. **form-interactions.spec.ts** (10 tests)

Tests form handling and data persistence:

- Handle form submission
- Validate required fields
- Clear form data with reset button
- Numeric input validation
- Submit button state during processing
- Maintain form state on page navigation
- Display success messages after submission
- Keyboard submission (Enter key)

**Coverage**: Form validation, submission, data persistence, user interactions

## Running Tests

### Run all E2E tests

```bash
pnpm e2e
```

### Run E2E tests with UI (interactive mode)

```bash
pnpm e2e:ui
```

### Run E2E tests in headed mode (visible browser)

```bash
pnpm e2e:headed
```

### Run E2E tests in debug mode

```bash
pnpm e2e:debug
```

### Run specific test file

```bash
pnpm exec playwright test e2e/dashboard-navigation.spec.ts
```

### Run tests for specific project (browser)

```bash
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit
```

### Run tests with specific tag

```bash
pnpm exec playwright test --grep @regression
```

## Prerequisites

1. **Development Server Running**: E2E tests require the application to be running on localhost:3000

   ```bash
   pnpm dev
   ```

2. **Node 16+**: Playwright requires Node 16 or higher

3. **Supported OS**: Windows, macOS, Linux

## Test Statistics

- **Total Test Files**: 4
- **Total Tests**: 49 (per browser)
- **Total Multi-Browser Tests**: 185 (49 tests × 5 projects: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)
- **Estimated Runtime**: 5-15 minutes (depending on system performance and browser count)

## Test Report

After running tests, an HTML report is generated:

```bash
# Open the test report
pnpm exec playwright show-report
```

The report includes:
- Test results (passed/failed)
- Screenshots of failures
- Video recordings of failures
- Detailed error traces

## Key Testing Patterns

### Navigation Testing

```typescript
test('should navigate to break-even analysis page', async ({ page }) => {
  const link = page.locator('a', { hasText: /analyse/i })
  await link.click()
  expect(page.url()).toContain('/analyse')
})
```

### Form Interaction Testing

```typescript
test('should handle form submission', async ({ page }) => {
  const input = page.locator('input[type="number"]').first()
  await input.fill('100')
  const submitButton = page.locator('button[type="submit"]')
  await submitButton.click()
})
```

### Responsiveness Testing

```typescript
test('should be responsive on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  const main = page.locator('main')
  await expect(main).toBeVisible()
})
```

### Accessibility Testing

```typescript
test('should allow keyboard navigation', async ({ page }) => {
  await page.keyboard.press('Tab')
  const focused = page.locator(':focus')
  await expect(focused).toBeAttached()
})
```

## Debugging Failed Tests

### Option 1: Debug Mode

```bash
pnpm e2e:debug
```

This opens Playwright Inspector with:
- Step-by-step execution
- DOM inspection
- Console evaluation
- Network logging

### Option 2: Headed Mode

```bash
pnpm e2e:headed
```

Run tests with visible browser windows for visual debugging.

### Option 3: Trace Viewer

```bash
pnpm exec playwright show-trace trace.zip
```

View detailed execution traces with:
- Network requests
- Screenshots
- DOM snapshots
- Console logs

## CI/CD Integration

For CI/CD pipelines, update your workflow to:

```yaml
- name: Install dependencies
  run: pnpm install

- name: Install Playwright browsers
  run: pnpm exec playwright install

- name: Build application
  run: pnpm build

- name: Start server
  run: pnpm start &

- name: Run E2E tests
  run: pnpm e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v2
  with:
    name: playwright-report
    path: playwright-report/
```

## Best Practices

1. **Wait for Elements**: Always wait for elements to be visible before interacting
2. **Use Data Attributes**: Add `data-testid` attributes to important elements for reliable selectors
3. **Avoid Timeouts**: Use explicit waits instead of arbitrary `waitForTimeout()`
4. **Mock External Services**: Mock API calls for faster, more reliable tests
5. **Test Critical Paths**: Focus on user journeys that have the most business impact
6. **Keep Tests Independent**: Each test should set up its own state
7. **Use Page Objects**: For larger test suites, consider organizing tests with page object patterns

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Option 1: Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Option 2: Use different port
PORT=3001 pnpm dev
```

### Playwright Browsers Not Installed

```bash
pnpm exec playwright install
```

### Tests Timing Out

Increase timeout in playwright.config.ts:

```typescript
use: {
  navigationTimeout: 30000,
  actionTimeout: 10000,
}
```

## Future Improvements

1. **Page Objects Pattern**: Implement page object models for better test organization
2. **Visual Regression Testing**: Add visual regression tests for UI consistency
3. **Performance Metrics**: Capture and assert on performance metrics (Core Web Vitals)
4. **Custom Fixtures**: Create reusable test fixtures for common setup/teardown
5. **Test Data Management**: Implement test data factories for consistent test scenarios
6. **Accessibility Audit**: Integrate axe-core for automated accessibility testing
7. **Mobile Testing**: Expand mobile test scenarios with real device testing

## Related Documentation

- [Playwright Documentation](https://playwright.dev)
- [Unit Testing](../jest.config.js) - Jest configuration for unit tests
- [GitHub Actions CI/CD](../.github/workflows) - CI/CD configuration (if applicable)

## Support

For issues or questions about E2E testing:

1. Check [Playwright Docs](https://playwright.dev/docs/intro)
2. Review test examples in this directory
3. Enable debug mode: `pnpm e2e:debug`
4. Check generated HTML report for failure details
