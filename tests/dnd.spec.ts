import { test, expect, Page } from '@playwright/test'
import { loginTestUser } from './login_helper'
// @ts-ignore
import { testUsers } from './test-users.js'
import { setupTestTask, cleanupTestTasks, spyOnStoreAction, waitForStoreAction, getLastStoreActionCall, dragAndDrop } from './test_utils'

test.describe('Drag and Drop & Resize', () => {
	let taskName: string
	const primaryUser = testUsers[0]

	test.beforeEach(async ({ page }: { page: Page }) => {
		await page.goto('/signout')
		await page.waitForURL(/.*\/signin/)
		await loginTestUser(page, primaryUser.email, primaryUser.password)
		await expect(page.locator('.app-header')).toBeVisible({ timeout: 15000 })

		taskName = `Test Task ${Date.now()}`
		await setupTestTask(page, taskName, { startTime: 10, duration: 60 })
	})

	test.afterEach(async ({ page }) => {
		await cleanupTestTasks(page)
	})

	test('should drag task to a new time', async ({ page }: { page: Page }) => {
		const task = page.locator('.task-wrapper-absolute').filter({ hasText: taskName }).first()
		await task.scrollIntoViewIfNeeded()
		const initialBox = await task.boundingBox()
		if (!initialBox) throw new Error('Task box not found')

		const start = {
			x: initialBox.x + initialBox.width / 2,
			y: initialBox.y + initialBox.height / 2
		}
		const end = { x: start.x, y: start.y + 160 } // +2 hours (80px per hour)

		await dragAndDrop(page, start, end)

		// Wait for UI update
		await page.waitForTimeout(500)

		const finalBox = await task.boundingBox()
		expect(finalBox?.y).toBeGreaterThan(initialBox.y + 100) // expect significant move
	})

	test('should resize task from bottom', async ({ page }: { page: Page }) => {
		const task = page.locator('.task-wrapper-absolute').filter({ hasText: taskName }).first()
		await task.scrollIntoViewIfNeeded()

		// Wait for task to be stable
		await task.waitFor({ state: 'visible' })

		const initialBox = await task.boundingBox()
		if (!initialBox) throw new Error('Task box not found')

		const resizeHandle = task.locator('.resize-handle.bottom')
		await resizeHandle.waitFor({ state: 'visible' })

		const handleBox = await resizeHandle.boundingBox()
		if (!handleBox) throw new Error('Handle box not found')

		const start = { x: handleBox.x + handleBox.width / 2, y: handleBox.y + handleBox.height / 2 }
		const end = { x: start.x, y: start.y + 80 } // +1 hour

		await dragAndDrop(page, start, end)

		// Wait for UI update
		await page.waitForTimeout(500)

		const finalBox = await task.boundingBox()
		expect(finalBox?.height).toBeGreaterThan(initialBox.height + 50)
	})

	test('should resize task from top', async ({ page }: { page: Page }) => {
		const task = page.locator('.task-wrapper-absolute').filter({ hasText: taskName }).first()
		await task.scrollIntoViewIfNeeded()
		await task.waitFor({ state: 'visible' })

		const initialBox = await task.boundingBox()
		if (!initialBox) throw new Error('Task box not found')

		const resizeHandle = task.locator('.resize-handle.top')
		// Hover to ensure handle might appear if strictly `display:none` (though CSS says it's visible)
		await task.hover()
		await resizeHandle.waitFor({ state: 'visible' })

		const handleBox = await resizeHandle.boundingBox()
		if (!handleBox) throw new Error('Handle box not found')

		const start = { x: handleBox.x + handleBox.width / 2, y: handleBox.y + handleBox.height / 2 }
		const end = { x: start.x, y: start.y - 80 } // -1 hour

		await dragAndDrop(page, start, end)

		// Wait for UI update
		await page.waitForTimeout(500)

		const finalBox = await task.boundingBox()
		// Top should move up (smaller Y), Height should increase
		expect(finalBox?.y).toBeLessThan(initialBox.y - 50)
		expect(finalBox?.height).toBeGreaterThan(initialBox.height + 50)
	})

	test('should drag task from To-Do pile to calendar', async ({ page }: { page: Page }) => {
		const todoName = `Todo Task ${Date.now()}`
		await setupTestTask(page, todoName, { isTodo: true })

		// Locate task in pile
		const todoTask = page.locator('.task-pile:has-text("To Do") .task-item').filter({ hasText: todoName }).first()
		await todoTask.scrollIntoViewIfNeeded()
		await expect(todoTask).toBeVisible()

		const taskBox = await todoTask.boundingBox()
		if (!taskBox) throw new Error('Todo task box not found')

		// Locate calendar slot (e.g., 9 AM)
		const slot = page.locator('.quarter-slot').nth(36) // 9th hour * 4
		await slot.scrollIntoViewIfNeeded()
		const slotBox = await slot.boundingBox()
		if (!slotBox) throw new Error('Slot box not found')

		const start = { x: taskBox.x + taskBox.width / 2, y: taskBox.y + taskBox.height / 2 }
		const end = { x: slotBox.x + slotBox.width / 2, y: slotBox.y + slotBox.height / 2 }

		await dragAndDrop(page, start, end)
		await page.waitForTimeout(500)

		// Verify it moved to calendar (absolute wrapper exists)
		const calendarTask = page.locator('.task-wrapper-absolute').filter({ hasText: todoName })
		await expect(calendarTask).toBeVisible()
	})

	test('should drag task from calendar to To-Do pile', async ({ page }: { page: Page }) => {
		// Use the default task created in beforeEach
		const task = page.locator('.task-wrapper-absolute').filter({ hasText: taskName }).first()
		await task.scrollIntoViewIfNeeded()
		const taskBox = await task.boundingBox()
		if (!taskBox) throw new Error('Calendar task box not found')

		// Locate To-Do pile
		const todoPile = page.locator('.task-pile:has-text("To Do")')
		await todoPile.scrollIntoViewIfNeeded()
		const pileBox = await todoPile.boundingBox()
		if (!pileBox) throw new Error('Todo pile box not found')

		const start = { x: taskBox.x + taskBox.width / 2, y: taskBox.y + taskBox.height / 2 }
		// Drop in the middle of the pile
		const end = { x: pileBox.x + pileBox.width / 2, y: pileBox.y + pileBox.height / 2 }

		await dragAndDrop(page, start, end)
		await page.waitForTimeout(500)

		// Verify it moved to pile
		const pileTask = page.locator('.task-pile:has-text("To Do") .task-item').filter({ hasText: taskName })
		await expect(pileTask).toBeVisible()
		// Verify it's gone from calendar
		await expect(page.locator('.task-wrapper-absolute').filter({ hasText: taskName })).not.toBeVisible()
	})
})
