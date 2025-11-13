import { test, expect } from '@playwright/test'

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
  })

  test('should load dashboard and display main sections', async ({ page }) => {
    // Check that we're on dashboard
    expect(page.url()).toContain('/dashboard')

    // Check for main dashboard elements
    const mainNav = page.locator('nav').first()
    await expect(mainNav).toBeVisible()
  })

  test('should display dashboard navigation menu', async ({ page }) => {
    // Look for navigation elements
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()

    // Navigation should contain common menu items
    const navText = await page.locator('nav').first().allTextContents()
    expect(navText.length).toBeGreaterThan(0)
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Page should still load
    const mainContent = page.locator('main').first()
    await expect(mainContent).toBeVisible()
  })

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    // Page should still load
    const mainContent = page.locator('main').first()
    await expect(mainContent).toBeVisible()
  })

  test('should have accessible heading structure', async ({ page }) => {
    // Check for h1 heading
    const headings = page.locator('h1, h2, h3')
    await expect(headings.first()).toBeVisible()
  })

  test('should allow keyboard navigation', async ({ page }) => {
    // Tab through navigation
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeAttached()
  })

  test('should display page with no JavaScript errors', async ({ page }) => {
    let jsErrors = false

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text())
        jsErrors = true
      }
    })

    // Wait for page to settle
    await page.waitForLoadState('networkidle')
    expect(jsErrors).toBe(false)
  })
})
