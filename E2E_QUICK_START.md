# E2E Testing Quick Start Guide

## 5-Second Setup

```bash
# Terminal 1: Start the dev server
pnpm dev

# Terminal 2: Run E2E tests
pnpm e2e
```

## Common Commands

```bash
# Run all E2E tests (headless)
pnpm e2e

# Run tests with visual browser (helpful for debugging)
pnpm e2e:headed

# Run tests in interactive UI mode (best for development)
pnpm e2e:ui

# Run tests in debug mode with step-by-step execution
pnpm e2e:debug

# Run specific test file
pnpm exec playwright test e2e/dashboard-navigation.spec.ts

# Run specific test by name
pnpm exec playwright test -g "should load dashboard"

# View HTML test report
pnpm exec playwright show-report
```

## Test Files

| File | Tests | Focus |
|------|-------|-------|
| `dashboard-navigation.spec.ts` | 16 | Navigation, accessibility, responsiveness |
| `kpi-dashboard.spec.ts` | 14 | Dashboard rendering, metrics, performance |
| `break-even-analysis.spec.ts` | 9 | Forms, calculations, user interactions |
| `form-interactions.spec.ts` | 10 | Form validation, submission, persistence |
| **Total** | **49 per browser** | **185 tests across 5 browsers** |

## Browser Coverage

- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Troubleshooting

**Tests timing out?**
- Ensure dev server is running: `pnpm dev`
- Check port 3000 is available: `lsof -i :3000`

**Playwright browsers not installed?**
- Install: `pnpm exec playwright install`

**Want to see test execution?**
- Use headed mode: `pnpm e2e:headed`

**Need to debug a specific test?**
- Use UI mode: `pnpm e2e:ui`
- Or debug mode: `pnpm e2e:debug`

## Test Structure

Each test follows this pattern:

```typescript
test('should do something', async ({ page }) => {
  // 1. Navigate
  await page.goto('/dashboard')

  // 2. Interact
  await page.locator('button').click()

  // 3. Assert
  expect(page.url()).toContain('/analyse')
})
```

## Key Assertions

```typescript
// Navigation
expect(page.url()).toContain('/dashboard')

// Visibility
await expect(element).toBeVisible()

// Text content
await expect(element).toHaveText('Expected text')

// Form values
expect(await input.inputValue()).toBe('value')

// Counts
expect(await elements.count()).toBeGreaterThan(0)
```

## For CI/CD

In your GitHub Actions or CI pipeline:

```bash
# Install browsers
pnpm exec playwright install

# Run tests
pnpm e2e

# Upload results
# Tests report: playwright-report/
```

## Next Steps

1. **Read Full Docs**: See [E2E_TESTING.md](./E2E_TESTING.md)
2. **Run Tests**: `pnpm e2e`
3. **Debug Failures**: `pnpm e2e:debug`
4. **View Report**: `pnpm exec playwright show-report`

---

**Happy testing!** 🎭
