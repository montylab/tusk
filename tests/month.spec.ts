import { test, expect } from '@playwright/test'
import { loginTestUser } from './login_helper'
import { cleanupTestTasks } from './test_utils'
// @ts-ignore
import { testUsers } from './test-users.js'

// Helper to create a task via the month view UI
async function createTaskInMonthView(page: any, taskName: string) {
	const dayCell = page.locator('.month-day-cell:not(.other-month)').first()
	await dayCell.click()
	const popup = page.locator('.popup-container')
	await expect(popup).toBeVisible({ timeout: 5000 })
	await popup.locator('#task-text').fill(taskName)
	await popup.locator('button:text("Create Task")').click()
	await expect(page.getByText(taskName).first()).toBeVisible({ timeout: 10000 })
}

test.describe('Month View', () => {
	const primaryUser = testUsers[0]

	test.beforeEach(async ({ page }) => {
		await loginTestUser(page, primaryUser.email, primaryUser.password)
		await cleanupTestTasks(page)
		await expect(page.locator('.task-item')).toHaveCount(0, { timeout: 10000 })
		// Navigate to month view
		await page.goto('/month')
		await expect(page.locator('.month-calendar')).toBeVisible({ timeout: 10000 })
	})

	test.afterEach(async ({ page }) => {
		await cleanupTestTasks(page)
	})

	test('should display month calendar grid', async ({ page }) => {
		// Check for day names header
		await expect(page.locator('.day-name').first()).toBeVisible()
		// Check grid structure (7 columns x 6 rows max)
		const weekRows = await page.locator('.week-row').count()
		expect(weekRows).toBeGreaterThanOrEqual(4)
		expect(weekRows).toBeLessThanOrEqual(6)
		// Check navigation buttons exist
		await expect(page.locator('.nav-btn').first()).toBeVisible()
		await expect(page.locator('.month-title')).toBeVisible()
	})

	test('should navigate between months', async ({ page }) => {
		const initialTitle = await page.locator('.month-title').textContent()

		// Click next month
		await page.locator('.nav-btn').last().click()
		await page.waitForTimeout(300)
		const nextTitle = await page.locator('.month-title').textContent()
		expect(nextTitle).not.toBe(initialTitle)

		// Click previous month twice to go back
		await page.locator('.nav-btn').first().click()
		await page.waitForTimeout(300)
		await page.locator('.nav-btn').first().click()
		await page.waitForTimeout(300)
		const prevTitle = await page.locator('.month-title').textContent()
		expect(prevTitle).not.toBe(nextTitle)
	})

	test('should open create popup when clicking on day cell', async ({ page }) => {
		// Click on a day cell (not on a task)
		const dayCell = page.locator('.month-day-cell').first()
		await dayCell.click()

		// Check popup is visible
		const popup = page.locator('.popup-container')
		await expect(popup).toBeVisible({ timeout: 5000 })
	})

	test('should create a task and display it in the calendar', async ({ page }) => {
		const taskName = `Month Test: ${Date.now()}`
		await createTaskInMonthView(page, taskName)
	})

	test('should open edit popup on double-click', async ({ page }) => {
		const taskName = `Month DblClick Test: ${Date.now()}`
		await createTaskInMonthView(page, taskName)

		// Find and double-click the task
		const taskItem = page.locator('.month-task-item', { hasText: taskName }).first()
		await taskItem.dblclick()

		// Check edit popup is visible
		const popup = page.locator('.popup-container')
		await expect(popup).toBeVisible({ timeout: 5000 })
		await expect(popup.locator('#task-text')).toHaveValue(taskName)
	})

	test('should show popover on single click', async ({ page }) => {
		const taskName = `Month Popover Test: ${Date.now()}`
		await createTaskInMonthView(page, taskName)

		// Click on task
		const taskItem = page.locator('.month-task-item', { hasText: taskName }).first()
		await taskItem.click()

		// Check popover is visible
		const popover = page.locator('.month-task-popover')
		await expect(popover).toBeVisible({ timeout: 5000 })
		await expect(popover.getByText(taskName)).toBeVisible()
	})

	test('should edit task via popover edit button', async ({ page }) => {
		const taskName = `Month PopEdit Test: ${Date.now()}`
		const editedName = `Month PopEdit Edited: ${Date.now()}`
		await createTaskInMonthView(page, taskName)

		// Click task to open popover
		const taskItem = page.locator('.month-task-item', { hasText: taskName }).first()
		await taskItem.click()

		// Click Edit button in popover
		const popover = page.locator('.month-task-popover')
		await popover.locator('.btn.edit').click()

		// Edit in popup
		const popup = page.locator('.popup-container')
		await expect(popup).toBeVisible()
		await popup.locator('#task-text').fill(editedName)
		await popup.locator('button:text("Save Changes")').click()

		// Verify edited task
		await expect(page.getByText(editedName).first()).toBeVisible({ timeout: 10000 })
	})

	test('should delete task via popover delete button', async ({ page }) => {
		const taskName = `Month PopDel Test: ${Date.now()}`
		await createTaskInMonthView(page, taskName)

		// Click task to open popover
		const taskItem = page.locator('.month-task-item', { hasText: taskName }).first()
		await taskItem.click()

		// Click Delete button in popover
		const popover = page.locator('.month-task-popover')
		await popover.locator('.btn.delete').click()

		// Verify task is gone
		await expect(page.getByText(taskName)).not.toBeVisible({ timeout: 10000 })
	})

	test('should support route /month/YYYY/MM format', async ({ page }) => {
		await page.goto('/month/2025/06')
		await expect(page.locator('.month-calendar')).toBeVisible()
		await expect(page.locator('.month-title')).toContainText('June 2025')
	})

	test('should support route /month/YYYY/MM/DD format', async ({ page }) => {
		await page.goto('/month/2025/12/25')
		await expect(page.locator('.month-calendar')).toBeVisible()
		await expect(page.locator('.month-title')).toContainText('December 2025')
	})

	test('should highlight today in the calendar', async ({ page }) => {
		// Navigate to current month
		const now = new Date()
		const year = now.getFullYear()
		const month = (now.getMonth() + 1).toString().padStart(2, '0')
		await page.goto(`/month/${year}/${month}`)

		// Check today is highlighted
		await expect(page.locator('.month-day-cell.is-today')).toBeVisible()
	})

	// TODO: This test is skipped because Playwright's dragTo() has issues with HTML5 native drag-and-drop
	// The feature works manually - this is a test automation limitation
	test.skip('should drag and drop task between days', async ({ page }) => {
		const taskName = `Month DnD Test: ${Date.now()}`
		await createTaskInMonthView(page, taskName)

		const taskItem = page.locator('.month-task-item', { hasText: taskName }).first()
		const sourceCell = page.locator('.month-day-cell:not(.other-month)').first()
		const targetCell = page.locator('.month-day-cell:not(.other-month)').nth(3)

		// Make sure target is different and visible
		await targetCell.scrollIntoViewIfNeeded()

		// Use native drag and drop
		await taskItem.dragTo(targetCell)
		await page.waitForTimeout(500)

		// Verify task moved to target cell
		const taskInTarget = targetCell.locator('.month-task-item', { hasText: taskName })
		await expect(taskInTarget).toBeVisible({ timeout: 10000 })
	})
})
