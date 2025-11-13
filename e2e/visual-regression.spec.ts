import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test('homepage should match snapshot', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for any animations to complete
    await page.waitForTimeout(500)

    // Capture full page screenshot
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100,
    })
  })

  test('dashboard should match snapshot', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of main content
    const mainContent = page.locator('main').first()
    await expect(mainContent).toHaveScreenshot('dashboard-main.png', {
      maxDiffPixels: 100,
    })
  })

  test('KPI analysis page should match snapshot', async ({ page }) => {
    await page.goto('/dashboard/analyse')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const mainContent = page.locator('main').first()
    await expect(mainContent).toHaveScreenshot('kpi-analysis.png', {
      maxDiffPixels: 100,
    })
  })

  test('planning page should match snapshot', async ({ page }) => {
    await page.goto('/dashboard/planung')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const mainContent = page.locator('main').first()
    await expect(mainContent).toHaveScreenshot('planning.png', {
      maxDiffPixels: 100,
    })
  })

  test('reports page should match snapshot', async ({ page }) => {
    await page.goto('/dashboard/berichte')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const mainContent = page.locator('main').first()
    await expect(mainContent).toHaveScreenshot('reports.png', {
      maxDiffPixels: 100,
    })
  })

  test('dark mode should match snapshot', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Find and click dark mode toggle
    const themeToggle = page.locator('button[title*="theme"], button[aria-label*="theme"], [role="button"][aria-label*="dark"], [role="button"][aria-label*="light"]')

    if (await themeToggle.first().isVisible()) {
      await themeToggle.first().click()
      await page.waitForTimeout(500) // Wait for theme transition

      const mainContent = page.locator('main').first()
      await expect(mainContent).toHaveScreenshot('dashboard-dark-mode.png', {
        maxDiffPixels: 100,
      })
    }
  })

  test('mobile responsive layout should match snapshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const mainContent = page.locator('main').first()
    await expect(mainContent).toHaveScreenshot('dashboard-mobile.png', {
      maxDiffPixels: 100,
    })
  })

  test('tablet responsive layout should match snapshot', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const mainContent = page.locator('main').first()
    await expect(mainContent).toHaveScreenshot('dashboard-tablet.png', {
      maxDiffPixels: 100,
    })
  })

  test('component rendering - KPI cards', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Look for metric/KPI card elements
    const kpiCards = page.locator('[class*="card"], [data-testid*="metric"], [role="region"]').first()

    if (await kpiCards.isVisible()) {
      await expect(kpiCards).toHaveScreenshot('kpi-card-component.png', {
        maxDiffPixels: 100,
      })
    }
  })

  test('form elements should render consistently', async ({ page }) => {
    await page.goto('/dashboard/planung')
    await page.waitForLoadState('networkidle')

    // Look for form elements
    const form = page.locator('form').first()

    if (await form.isVisible()) {
      await expect(form).toHaveScreenshot('form-elements.png', {
        maxDiffPixels: 100,
      })
    }
  })

  test('charts and visualizations should render consistently', async ({ page }) => {
    await page.goto('/dashboard/analyse')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000) // Wait for chart animations

    // Look for SVG elements (charts)
    const charts = page.locator('svg').first()

    if (await charts.isVisible()) {
      await expect(charts).toHaveScreenshot('chart-visualization.png', {
        maxDiffPixels: 200, // Charts may have slight rendering differences
      })
    }
  })

  test('header/navigation should remain consistent', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Capture header/nav
    const nav = page.locator('nav').first()

    if (await nav.isVisible()) {
      await expect(nav).toHaveScreenshot('navigation-header.png', {
        maxDiffPixels: 100,
      })
    }
  })
})
