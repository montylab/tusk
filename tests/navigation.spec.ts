import { test, expect } from '@playwright/test'
import { loginTestUser } from './login_helper'
import { setupTestTask, cleanupTestTasks } from './test_utils'
// @ts-ignore
import { testUsers } from './test-users.js'

test.describe('Date Navigation & Persistence', () => {
	test.setTimeout(60000)
	const primaryUser = testUsers[0]

	test.beforeEach(async ({ page }) => {
		await loginTestUser(page, primaryUser.email, primaryUser.password)
		await cleanupTestTasks(page)
	})

	test.afterEach(async ({ page }) => {
		await cleanupTestTasks(page)
	})

	test('should maintain separate task lists for different days', async ({ page }) => {
		const todayTask = `Task for Today ${Date.now()}`
		const tomorrowTask = `Task for Tomorrow ${Date.now()}`

		// 1. Create task on Today
		await setupTestTask(page, todayTask, { startTime: 10, duration: 60 })
		const todayItem = page.locator('.task-wrapper-absolute').filter({ hasText: todayTask })
		await expect(todayItem).toBeVisible()

		// 2. Add Day Column
		const addDayBtn = page.locator('.add-day-zone')
		await expect(addDayBtn).toBeVisible()
		await addDayBtn.click()

		// Now we should see 2 columns.
		const columns = page.locator('.day-column')
		await expect(columns).toHaveCount(2)

		// The second column is Tomorrow.
		const tomorrowColumn = columns.nth(1)
		const slot = tomorrowColumn.locator('.quarter-slot').nth(36) // 9 AM
		await slot.click()

		const popup = page.locator('.popup-container')
		await expect(popup).toBeVisible()

		await popup.locator('#task-text').fill(tomorrowTask)
		await popup.locator('button:text("Create Task")').click()

		// Verify tasks
		await expect(todayItem).toBeVisible() // Today's task still there
		const tomorrowItem = page.locator('.task-wrapper-absolute').filter({ hasText: tomorrowTask })
		await expect(tomorrowItem).toBeVisible()

		// Verify visual separation (x coordinates different)
		const todayBox = await todayItem.boundingBox()
		const tomorrowBox = await tomorrowItem.boundingBox()
		if (todayBox && tomorrowBox) {
			expect(todayBox.x).toBeLessThan(tomorrowBox.x)
		}

		// 3. Persistence Check involves reloading or navigating
		await page.reload()
		await expect(page.locator('.app-header')).toBeVisible()
		await expect(todayItem).toBeVisible()

		// Re-open tomorrow column
		const addDayBtn2 = page.locator('.add-day-zone')
		await expect(addDayBtn2).toBeVisible()
		await addDayBtn2.click()

		// Now we should see 2 columns.
		const columnsAfterReload = page.locator('.day-column')
		await expect(columnsAfterReload).toHaveCount(2)

		// Task on tomorrow should reappear
		await expect(page.locator('.task-wrapper-absolute').filter({ hasText: tomorrowTask })).toBeVisible()
	})

	test('should navigate to valid date via URL', async ({ page }) => {
		// Construct tomorrow's date YYYY-MM-DD using Local Time
		const tomorrow = new Date()
		tomorrow.setDate(tomorrow.getDate() + 1)

		const year = tomorrow.getFullYear()
		const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
		const day = String(tomorrow.getDate()).padStart(2, '0')
		const dateStr = `${year}-${month}-${day}`

		const taskName = `URL Nav Task ${Date.now()}`
		console.log(`Navigating to tomorrow: ${dateStr}`)

		// Go to /day/YYYY-MM-DD
		await page.goto(`/day/${dateStr}`)
		await expect(page.locator('.app-header')).toBeVisible({ timeout: 15000 })

		// Create task
		console.log('Creating task in tomorrow view...')
		const slot = page.locator('.quarter-slot').nth(40) // 10 AM
		await slot.waitFor({ state: 'visible' })
		await slot.click()

		const popup = page.locator('.popup-container')
		await expect(popup).toBeVisible()
		await popup.locator('#task-text').fill(taskName)
		await popup.locator('button:text("Create Task")').click()

		await expect(page.getByText(taskName)).toBeVisible()
		await page.waitForTimeout(500)

		console.log('Task created.')

		// Go execution to / (Today)
		console.log('Navigating to Today...')
		await page.goto('/')
		await expect(page.locator('.app-header')).toBeVisible({ timeout: 15000 })
		await expect(page.getByText(taskName)).not.toBeVisible()

		// Go back to tomorrow
		console.log('Navigating back to tomorrow...')
		await page.goto(`/day/${dateStr}`)
		await expect(page.locator('.app-header')).toBeVisible({ timeout: 15000 })
		const taskLocator = page.getByText(taskName).first()
		await taskLocator.waitFor({ state: 'attached', timeout: 15000 })
		await taskLocator.scrollIntoViewIfNeeded()
		await expect(taskLocator).toBeVisible()
	})
})
