import { test, expect, Page } from '@playwright/test'
import { loginTestUser } from './login_helper'
import { setupTestTask, cleanupTestTasks, dragAndDrop } from './test_utils'
// @ts-ignore
import { testUsers } from './test-users.js'

test.describe('Shortcuts & Templates', () => {
  test.setTimeout(60000)
  const primaryUser = testUsers[0]

  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, primaryUser.email, primaryUser.password)
    await cleanupTestTasks(page)
  })

  test.afterEach(async ({ page }) => {
    await cleanupTestTasks(page)
  })

  test('should create a shortcut by dragging a task from calendar to Shortcuts pile', async ({ page }) => {
    const taskName = `Template Source ${Date.now()}`
    // Create a task on calendar first
    await setupTestTask(page, taskName, { startTime: 10, duration: 60 })

    const taskItem = page.locator('.task-wrapper-absolute').filter({ hasText: taskName }).first()
    await taskItem.waitFor({ state: 'visible' })

    const shortcutsPile = page.locator('.task-pile').filter({ hasText: 'Shortcuts' })
    await shortcutsPile.waitFor({ state: 'visible' })

    await taskItem.scrollIntoViewIfNeeded()
    await shortcutsPile.scrollIntoViewIfNeeded()

    const taskBox = await taskItem.boundingBox()
    const pileBox = await shortcutsPile.boundingBox()

    if (taskBox && pileBox) {
      await dragAndDrop(
        page,
        { x: taskBox.x + taskBox.width / 2, y: taskBox.y + taskBox.height / 2 },
        { x: pileBox.x + pileBox.width / 2, y: pileBox.y + pileBox.height / 2 }
      )
    }

    // Wait for persistence
    await page.waitForTimeout(1000)

    // Verify: Calendar -> Shortcut is a MOVE
    const shortcutItem = shortcutsPile.locator('.task-item').filter({ hasText: taskName }).first()
    await expect(shortcutItem).toBeVisible()

    // Verify it is gone from calendar (Move behavior)
    await expect(taskItem).not.toBeVisible()
  })

  test('should drag a shortcut to the calendar creating a COPY', async ({ page }) => {
    const shortcutName = `Reusable Task ${Date.now()}`
    console.log('Creating initial task:', shortcutName)

    // Setup: Create task on calendar, check visibility
    await setupTestTask(page, shortcutName, { startTime: 9, duration: 30 })
    const initialTask = page.locator('.task-wrapper-absolute').filter({ hasText: shortcutName }).first()
    await expect(initialTask).toBeVisible()

    // Step 1: Move to Shortcuts
    console.log('Moving to shortcuts...')
    const shortcutsPile = page.locator('.task-pile').filter({ hasText: 'Shortcuts' })

    await initialTask.scrollIntoViewIfNeeded()
    await shortcutsPile.scrollIntoViewIfNeeded()

    const taskBox = await initialTask.boundingBox()
    const pileBox = await shortcutsPile.boundingBox()

    if (taskBox && pileBox) {
      await dragAndDrop(
        page,
        { x: taskBox.x + taskBox.width / 2, y: taskBox.y + taskBox.height / 2 },
        { x: pileBox.x + pileBox.width / 2, y: pileBox.y + pileBox.height / 2 }
      )
    }
    await page.waitForTimeout(1000) // 1s wait

    // Assert Step 1: Shortcut Exists, Calendar Task Gone
    console.log('Verifying move to shortcuts...')
    const shortcut = shortcutsPile.locator('.task-item').filter({ hasText: shortcutName }).first()
    await expect(shortcut).toBeVisible()
    await expect(initialTask).not.toBeVisible()

    // Step 2: Drag Shortcut to Calendar (Clone)
    console.log('Dragging back to calendar...')
    await shortcut.scrollIntoViewIfNeeded() // Ensure visible
    const shortcutBox = await shortcut.boundingBox()
    const targetSlot = page.locator('.quarter-slot').nth(48) // 12:00 PM
    await targetSlot.scrollIntoViewIfNeeded() // Ensure visible
    const slotBox = await targetSlot.boundingBox()

    if (shortcutBox && slotBox) {
      await dragAndDrop(
        page,
        { x: shortcutBox.x + shortcutBox.width / 2, y: shortcutBox.y + shortcutBox.height / 2 },
        { x: slotBox.x + slotBox.width / 2, y: slotBox.y + slotBox.height / 2 }
      )
    }

    await page.waitForTimeout(1000)

    // Verify:
    // 1. New task appears on calendar
    console.log('Verifying copy on calendar...')
    const newCalendarTask = page.locator('.task-wrapper-absolute').filter({ hasText: shortcutName }).first()
    await expect(newCalendarTask).toBeVisible()

    // 2. SHORTCUT STILL EXISTS in pile (Clone behavior)
    console.log('Verifying shortcut persists...')
    await expect(shortcut).toBeVisible()
  })
})
