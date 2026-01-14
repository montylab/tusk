import { test, expect } from '@playwright/test'

test.describe('Header Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock user BEFORE navigation
    await page.addInitScript(() => {
      ;(window as any).__MOCK_USER__ = {
        uid: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://lh3.googleusercontent.com/a/ACg8ocL-f_i456789=s96-c'
      }
    })

    // Navigate to the app
    await page.goto('/')

    // Wait for the header to appear
    await expect(page.locator('.app-header')).toBeVisible()
  })

  test('should navigate between day, week, and month views', async ({ page }) => {
    // Check Day view (active by default or after home redirect)
    await expect(page.locator('.view-btn.active')).toContainText('Day')

    // Click Week
    await page.click('button:text("Week")')
    await expect(page).toHaveURL(/.*\/week/)
    await expect(page.locator('.view-btn.active')).toContainText('Week')

    // Click Month
    await page.click('button:text("Month")')
    await expect(page).toHaveURL(/.*\/month/)
    await expect(page.locator('.view-btn.active')).toContainText('Month')

    // Click Day
    await page.click('button:text("Day")')
    await expect(page).toHaveURL(/.*\/day/)
    await expect(page.locator('.view-btn.active')).toContainText('Day')
  })

  test('should navigate to home when clicking logo', async ({ page }) => {
    // Move to week view first
    await page.click('button:text("Week")')
    await expect(page).toHaveURL(/.*\/week/)

    // Click logo
    await page.click('.logo-container')
    // Home route '/' renders DayViewPage
    await expect(page).toHaveURL(/.*\//)
    await expect(page.locator('.view-btn.active')).toContainText('Day')
  })

  test('should navigate to settings when clicking settings button', async ({ page }) => {
    await page.click('button[title="Settings"]')
    await expect(page).toHaveURL(/.*\/settings/)
  })

  test('should navigate to signout when clicking logout button', async ({ page }) => {
    await page.click('button[title="Logout"]')
    await expect(page).toHaveURL(/.*\/signout/)
  })
})
