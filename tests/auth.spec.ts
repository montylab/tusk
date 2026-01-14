import { test, expect } from '@playwright/test'
import { loginTestUser } from './login_helper'
// @ts-ignore - test-users.js is in gitignore
import { testUsers } from './test-users.js'

test.describe('Authentication & Security', () => {
  const primaryUser = testUsers[0]

  test.beforeEach(async ({ page }) => {
    // Force logout to clean state
    await page.goto('/signout')
    await page.waitForURL(/.*signin/)
  })

  test('should redirect unauthenticated users to /signin', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/.*signin/)
  })

  test('should explicitly create a new account via signup toggle', async ({ page }) => {
    const newUser = { email: `new-${Date.now()}@example.com`, password: 'password123' }
    await page.goto('/signin')

    await page.click('.text-link') // Switch to signup
    await page.fill('#email', newUser.email)
    await page.fill('#password', newUser.password)
    await page.click('.submit-btn')

    await expect(page.locator('.app-header')).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/.*(\/|day)/)
  })

  test('should persist authentication on page refresh (F5)', async ({ page }) => {
    await loginTestUser(page, primaryUser.email, primaryUser.password)
    await page.goto('/settings')
    await expect(page.locator('.app-header')).toBeVisible()

    await page.reload()

    // Wait for the header to reappear after refresh
    await expect(page.locator('.app-header')).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/.*\/settings/)
  })

  test('should show error on invalid login credentials', async ({ page }) => {
    await page.goto('/signin')
    await page.fill('#email', 'nonexistent@example.com')
    await page.fill('#password', 'wrong-pass')
    await page.click('.submit-btn')

    const error = page.locator('.error-text')
    await expect(error).toBeVisible()
    await expect(error).not.toBeEmpty()
  })

  test('should logout correctly and prevent back-navigation', async ({ page }) => {
    await loginTestUser(page, primaryUser.email, primaryUser.password)

    const logoutBtn = page.getByTitle('Logout')
    await expect(logoutBtn).toBeVisible({ timeout: 10000 })
    await logoutBtn.click()

    await expect(page).toHaveURL(/.*signin/, { timeout: 15000 })

    await page.goto('/settings')
    await expect(page).toHaveURL(/.*signin/)
  })
})
