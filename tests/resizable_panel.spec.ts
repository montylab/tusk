import { test, expect } from '@playwright/test'
import { loginTestUser } from './login_helper'

test.describe('ResizablePanel E2E', () => {
	test.beforeEach(async ({ page }) => {
		await loginTestUser(page)
		await page.goto('/day')
		// Wait for the layout to be ready
		await expect(page.locator('.page-layout')).toBeVisible()
	})

	test('should resize the right sidebar (width)', async ({ page }) => {
		const sidebar = page.locator('.resizable-panel.width')
		const resizer = sidebar.locator('.resize-handle.left')

		const initialBox = await sidebar.boundingBox()
		if (!initialBox) throw new Error('Sidebar not found')

		const initialWidth = initialBox.width

		// Resizer is at the left edge of the right sidebar. Dragging left increases width.
		await resizer.hover()
		await page.mouse.down()
		// Move mouse to initial position - 100px (dragging left)
		await page.mouse.move(initialBox.x - 100, initialBox.y + 100, { steps: 20 })
		await page.mouse.up()

		const finalBox = await sidebar.boundingBox()
		if (!finalBox) throw new Error('Sidebar bounding box lost')

		expect(finalBox.width).toBeGreaterThan(initialWidth)
		// Default width is 300, we dragged 100 left, should be ~400
		expect(finalBox.width).toBeCloseTo(initialWidth + 100, -1)
	})

	test('should resize the shortcuts pile (height)', async ({ page }) => {
		const shortcutsPile = page.locator('.resizable-panel.height')
		const resizer = shortcutsPile.locator('.resize-handle.bottom')

		const initialBox = await shortcutsPile.boundingBox()
		if (!initialBox) throw new Error('Shortcuts pile not found')

		const initialHeight = initialBox.height

		// Resizer is at the bottom edge. Dragging down increases height.
		await resizer.hover()
		await page.mouse.down()
		await page.mouse.move(initialBox.x + 50, initialBox.y + initialHeight + 100, { steps: 20 })
		await page.mouse.up()

		const finalBox = await shortcutsPile.boundingBox()
		if (!finalBox) throw new Error('Shortcuts pile bounding box lost')

		expect(finalBox.height).toBeGreaterThan(initialHeight)
		expect(finalBox.height).toBeCloseTo(initialHeight + 100, -1)
	})

	test('should respect percentage constraints', async ({ page }) => {
		const sidebar = page.locator('.sidebar.right')
		const shortcutsPile = page.locator('.resizable-panel.height')
		const resizer = shortcutsPile.locator('.resize-handle.bottom')

		const sidebarBox = await sidebar.boundingBox()
		if (!sidebarBox) throw new Error('Sidebar not found')

		// Attempt to drag shortcuts pile to exceed 90% of sidebar height
		await resizer.hover()
		await page.mouse.down()
		// Drag way past the sidebar bottom
		await page.mouse.move(sidebarBox.x + 10, sidebarBox.y + sidebarBox.height + 500, { steps: 20 })
		await page.mouse.up()

		const finalBox = await shortcutsPile.boundingBox()
		if (!finalBox) throw new Error('Shortcuts pile bounding box lost')

		// Max percent is 90%
		expect(finalBox.height).toBeLessThanOrEqual(sidebarBox.height * 0.91)
	})

	test('should persist size across reloads', async ({ page }) => {
		const sidebar = page.locator('.resizable-panel.width')
		const resizer = sidebar.locator('.resize-handle.left')

		const initialBox = await sidebar.boundingBox()
		if (!initialBox) throw new Error('Sidebar not found')

		// Resize to something specific
		const targetWidth = 450
		const delta = targetWidth - initialBox.width

		await resizer.hover()
		await page.mouse.down()
		await page.mouse.move(initialBox.x - delta, initialBox.y + 100, { steps: 20 })
		await page.mouse.up()

		// Verify local storage was updated (optional but good)
		const savedSize = await page.evaluate(() => localStorage.getItem('right-sidebar-width'))
		expect(Number(savedSize)).toBeCloseTo(targetWidth, -1)

		await page.reload()
		await expect(page.locator('.page-layout')).toBeVisible()

		const boxesAfterReload = await page.locator('.resizable-panel.width').boundingBox()
		expect(boxesAfterReload?.width).toBeCloseTo(targetWidth, -1)
	})
})
