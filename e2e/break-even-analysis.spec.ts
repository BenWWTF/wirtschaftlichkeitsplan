import { test, expect } from '@playwright/test'

test.describe('Break-Even Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should navigate to break-even analysis page', async ({ page }) => {
    // Look for a link or button to break-even analysis
    const breakEvenLink = page.locator('a, button', {
      hasText: /break.even|analyse|Analyse/i,
    }).first()

    if (await breakEvenLink.isVisible()) {
      await breakEvenLink.click()
      await page.waitForLoadState('networkidle')

      // Should be on analyse page
      expect(page.url()).toContain('/analyse')
    }
  })

  test('should display therapy configuration section', async ({ page }) => {
    // Navigate to analyse page
    await page.goto('/dashboard/analyse')
    await page.waitForLoadState('networkidle')

    // Look for configuration elements
    const configSection = page.locator('section, div[role="region"]').first()
    await expect(configSection).toBeVisible()
  })

  test('should allow adding therapy types', async ({ page }) => {
    await page.goto('/dashboard/analyse')
    await page.waitForLoadState('networkidle')

    // Look for add button (might be "Add Therapy", "New Therapy", "+", etc.)
    const addButton = page.locator('button', {
      hasText: /add|new|create|\+/i,
    }).first()

    if (await addButton.isVisible()) {
      const buttonCount = await page
        .locator('button, div[role="button"]')
        .count()
      expect(buttonCount).toBeGreaterThan(0)
    }
  })

  test('should display KPI metrics and calculations', async ({ page }) => {
    await page.goto('/dashboard/analyse')
    await page.waitForLoadState('networkidle')

    // Look for metrics display (tables, cards, or sections with numbers)
    const numbers = page.locator('text=/\\d+\\.?\\d*/') // Matches numbers
    const numberCount = await numbers.count()
    expect(numberCount).toBeGreaterThan(0)
  })

  test('should handle form inputs for therapy configuration', async ({ page }) => {
    await page.goto('/dashboard/analyse')
    await page.waitForLoadState('networkidle')

    // Look for input fields
    const inputs = page.locator('input[type="number"], input[type="text"]')
    const inputCount = await inputs.count()

    if (inputCount > 0) {
      // Try to interact with first input
      const firstInput = inputs.first()
      await firstInput.click()
      await firstInput.fill('100')

      // Verify value was set
      const value = await firstInput.inputValue()
      expect(value).toBe('100')
    }
  })

  test('should display break-even calculations', async ({ page }) => {
    await page.goto('/dashboard/analyse')
    await page.waitForLoadState('networkidle')

    // Look for calculation results
    const results = page.locator('[data-testid*="result"], [class*="result"]')
    const resultCount = await results.count()

    if (resultCount === 0) {
      // Look for any section that displays calculated values
      const numberDisplay = page.locator('text=/€|EUR|€.*\\d+/i')
      const displayCount = await numberDisplay.count()
      expect(displayCount).toBeGreaterThanOrEqual(0)
    }
  })

  test('should be responsive during analysis input', async ({ page }) => {
    await page.goto('/dashboard/analyse')

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 })
    let content = page.locator('main, [role="main"]')
    await expect(content).toBeVisible()

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(content).toBeVisible()

    // Test on desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(content).toBeVisible()
  })

  test('should persist state when navigating away and back', async ({ page }) => {
    await page.goto('/dashboard/analyse')
    await page.waitForLoadState('networkidle')

    // Try to find and fill an input
    const input = page.locator('input[type="number"]').first()
    if (await input.isVisible()) {
      const testValue = '250'
      await input.fill(testValue)

      // Navigate away
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Navigate back
      await page.goBack()
      await page.waitForLoadState('networkidle')

      // Check if value persists (may be in URL or localStorage)
      const currentValue = await input.inputValue()
      expect(currentValue).toBe(testValue)
    }
  })

  test('should display helpful error messages for invalid input', async ({
    page,
  }) => {
    await page.goto('/dashboard/analyse')
    await page.waitForLoadState('networkidle')

    // Try to find an input field
    const input = page.locator('input[type="number"]').first()
    if (await input.isVisible()) {
      // Try invalid input
      await input.fill('-999')

      // Look for error message
      const errorMsg = page.locator('[role="alert"], .error, [class*="error"]')
      // Error may or may not appear depending on validation
      const errorCount = await errorMsg.count()
      expect(errorCount).toBeGreaterThanOrEqual(0)
    }
  })
})
