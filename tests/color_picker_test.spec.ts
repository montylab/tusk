import { test, expect } from '@playwright/test'
import { loginTestUser } from './login_helper'
import { cleanupTestTasks } from './test_utils'
// @ts-ignore
import { testUsers } from './test-users.js'

test.describe('Color Picker Verification', () => {
	const primaryUser = testUsers[0]

	test.beforeEach(async ({ page }) => {
		await loginTestUser(page, primaryUser.email, primaryUser.password)
		// We clean up BEFORE to start fresh, but NOT after
		await cleanupTestTasks(page)
		await expect(page.locator('.task-item')).toHaveCount(0, { timeout: 10000 })
	})

	test('should create 9 tasks with unique categories and distinct preset colors', async ({ page }) => {
		// Colors count in ColorPickerInput.vue is 9 (indices 0 to 8)
		const taskCount = 9
		const timestamp = Date.now()

		for (let i = 0; i < taskCount; i++) {
			const taskName = `Task Color ${i + 1} - ${timestamp}`
			const categoryName = `Category ${timestamp}-${i + 1}`

			// 1. Open Task Editor (click on a slot)
			// Spread them out every 4 slots (1 hour) so they don't overlap visually too much
			const slotIndex = 20 + i * 4
			const slot = page.locator('.quarter-slot').nth(slotIndex)
			await slot.scrollIntoViewIfNeeded()
			await slot.click()

			// 2. Wait for popup
			const popup = page.locator('.popup-container')
			await expect(popup).toBeVisible()

			// 3. Fill Task Name
			await popup.locator('#task-text').fill(taskName)

			// 4. Fill Category
			// This triggers the "New Category" logic which shows the color picker
			await popup.locator('input[placeholder="Type to search or create..."]').fill(categoryName)

			// Wait for color picker to appear
			await expect(page.locator('.presets-container')).toBeVisible()

			// 5. Select the i-th color preset
			// Note: The custom picker trigger is also a .color-swatch, but usually last.
			// The v-for is first. So nth(i) should map to the presets correctly.
			await popup.locator('.presets-container .color-swatch').nth(i).click()

			console.log(`Creating task ${i + 1}: ${taskName}`)

			// 6. Create Task
			await popup.locator('button:text("Create Task")').click()

			// 7. Verify creation before proceeding
			await expect(page.getByText(taskName).first()).toBeVisible()
		}

		// Pause here if running with --headed to see the result,
		// or just let it finish. The tasks will remain in the DB/UI until next cleanup.
	})
})
