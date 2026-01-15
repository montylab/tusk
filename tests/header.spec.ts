import { test, expect } from '@playwright/test'
import { loginTestUser } from './login_helper'
// @ts-ignore
import { testUsers } from './test-users.js'

test.describe('Header Navigation', () => {
	const primaryUser = testUsers[0]

	test.beforeEach(async ({ page }) => {
		await loginTestUser(page, primaryUser.email, primaryUser.password)
		// Navigate to the app (login helper already does basic nav, but we ensure we are at root)
		await page.goto('/')

		// Wait for the header to appear
		await expect(page.locator('.app-header')).toBeVisible()
	})

	test('should navigate between day, week, and month views', async ({ page }) => {
		// Check Day view (active by default or after home redirect)
		await expect(page.locator('.view-btn.active')).toContainText('Day')

		// Click Week
		await page.click('a.view-btn:text("Week")')
		await expect(page).toHaveURL(/.*\/week/)
		await expect(page.locator('.view-btn.active')).toContainText('Week')

		// Click Month
		await page.click('a.view-btn:text("Month")')
		await expect(page).toHaveURL(/.*\/month/)
		await expect(page.locator('.view-btn.active')).toContainText('Month')

		// Click Day
		await page.click('a.view-btn:text("Day")')
		await expect(page).toHaveURL(/.*\/day/)
		await expect(page.locator('.view-btn.active')).toContainText('Day')
	})

	test('should navigate to home when clicking logo', async ({ page }) => {
		// Move to week view first
		await page.click('a.view-btn:text("Week")')
		await expect(page).toHaveURL(/.*\/week/)

		// Click logo
		await page.click('.logo-container')
		// Home route '/' renders DayViewPage
		await expect(page).toHaveURL(/.*\//)
		await expect(page.locator('.view-btn.active')).toContainText('Day')
	})

	test('should navigate to settings when clicking settings button', async ({ page }) => {
		await page.click('a[title="Settings"]')
		await expect(page).toHaveURL(/.*\/settings/)
	})

	test('should navigate to signout when clicking logout button', async ({ page }) => {
		await page.click('a[title="Logout"]')
		await expect(page).toHaveURL(/.*\/signout/)
	})
})
