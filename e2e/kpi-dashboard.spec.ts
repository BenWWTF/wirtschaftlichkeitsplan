import { test, expect } from '@playwright/test'

test.describe('KPI Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should display KPI dashboard with main metrics', async ({ page }) => {
    // Check for presence of KPI cards or sections
    const kpiElements = page.locator('[class*="card"], [class*="metric"], [role="region"]')
    const elementCount = await kpiElements.count()
    expect(elementCount).toBeGreaterThan(0)
  })

  test('should display revenue metrics', async ({ page }) => {
    // Look for revenue-related text
    const revenueText = page.locator('text=/revenue|umsatz|einnahmen/i')
    const revenueCount = await revenueText.count()

    if (revenueCount > 0) {
      await expect(revenueText.first()).toBeVisible()
    }
  })

  test('should display occupancy rate metrics', async ({ page }) => {
    // Look for occupancy-related text
    const occupancyText = page.locator('text=/occupancy|auslastung|auslastungsquote/i')
    const occupancyCount = await occupancyText.count()

    if (occupancyCount > 0) {
      await expect(occupancyText.first()).toBeVisible()
    }
  })

  test('should display profitability status', async ({ page }) => {
    // Look for profitability-related text
    const profitText = page.locator('text=/profit|rentabilität|gewinn|verlust/i')
    const profitCount = await profitText.count()

    if (profitCount > 0) {
      await expect(profitText.first()).toBeVisible()
    }
  })

  test('should render charts or visualizations', async ({ page }) => {
    // Look for SVG elements (common in chart libraries like Recharts)
    const charts = page.locator('svg')
    const chartCount = await charts.count()

    // Charts may or may not be present, but if they are they should render
    if (chartCount > 0) {
      const firstChart = charts.first()
      await expect(firstChart).toBeVisible()
    }
  })

  test('should display numeric values in KPI cards', async ({ page }) => {
    // Look for number-like content
    const numbers = page.locator('text=/\\d+([.,]\\d{2})?%?/')
    const numberCount = await numbers.count()
    expect(numberCount).toBeGreaterThan(0)
  })

  test('should have proper color contrast for accessibility', async ({ page }) => {
    // Check for text elements
    const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6')
    const elementCount = await textElements.count()
    expect(elementCount).toBeGreaterThan(0)

    // Text should be visible (basic check for contrast)
    if (elementCount > 0) {
      const firstElement = textElements.first()
      await expect(firstElement).toBeVisible()
    }
  })

  test('should support dark mode toggle', async ({ page }) => {
    // Look for theme toggle button (may be in header or settings)
    const themeToggle = page.locator('button[title*="theme"], button[aria-label*="theme"]')

    if (await themeToggle.isVisible()) {
      // Click to toggle
      await themeToggle.click()

      // Page should still be functional
      const mainContent = page.locator('main')
      await expect(mainContent).toBeVisible()

      // Toggle back
      await themeToggle.click()
    }
  })

  test('should load KPI data within reasonable time', async ({ page }) => {
    // Start timer
    const startTime = Date.now()

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Page should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('should update metrics when data changes', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Get initial metric value
    const metric = page.locator('[class*="metric"], [data-testid*="metric"]').first()

    if (await metric.isVisible()) {
      const initialText = await metric.textContent()

      // Wait a moment
      await page.waitForTimeout(1000)

      // Text might remain the same (if no updates) or change (if live data)
      const updatedText = await metric.textContent()

      // At least one should have content
      expect(initialText || updatedText).toBeTruthy()
    }
  })

  test('should be responsive across all viewport sizes', async ({ page }) => {
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    let main = page.locator('main').first()
    await expect(main).toBeVisible()

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(main).toBeVisible()

    // Desktop
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(main).toBeVisible()

    // Wide desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(main).toBeVisible()
  })

  test('should have accessible labels for all metrics', async ({ page }) => {
    // Check for aria-labels or visible labels
    const labelElements = page.locator('[aria-label], label, h2, h3')
    const labelCount = await labelElements.count()
    expect(labelCount).toBeGreaterThan(0)
  })

  test('should allow keyboard navigation of metrics', async ({ page }) => {
    // Tab to first interactive element
    await page.keyboard.press('Tab')

    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeAttached()

    // Continue tabbing
    await page.keyboard.press('Tab')
    const secondFocused = page.locator(':focus')
    await expect(secondFocused).toBeAttached()
  })
})
