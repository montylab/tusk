import { test, expect } from '@playwright/test';
import { loginTestUser } from './login_helper';
import { setupTestTask, cleanupTestTasks, dragAndDrop } from './test_utils';
// @ts-ignore
import { testUsers } from './test-users.js';

test.describe('Task Management & Persistence', () => {
    const primaryUser = testUsers[0];

    test.beforeEach(async ({ page }) => {
        await loginTestUser(page, primaryUser.email, primaryUser.password);
        await cleanupTestTasks(page);
        // Wait for items to disappear
        await expect(page.locator('.task-item')).toHaveCount(0, { timeout: 10000 });
    });

    test.afterEach(async ({ page }) => {
        await cleanupTestTasks(page);
    });

    test('should create a scheduled task by clicking a timeline slot', async ({ page }) => {
        const uniqueTaskName = `Test Task: Live ${Date.now()}`;
        // Wait for grid to be ready
        const slot = page.locator('.quarter-slot').nth(20);
        await slot.waitFor({ state: 'visible' });
        await slot.click();

        // Fill the TaskEditorPopup
        const popup = page.locator('.popup-container');
        await expect(popup).toBeVisible();

        await popup.locator('#task-text').fill(uniqueTaskName);
        await popup.locator('button:text("Create Task")').click();

        // Verify it exists in the UI
        await expect(page.getByText(uniqueTaskName).first()).toBeVisible({ timeout: 10000 });

        // Final check: Persistence
        await page.reload();
        await expect(page.getByText(uniqueTaskName).first()).toBeVisible({ timeout: 10000 });
    });

    test('should edit an existing task via the pencil icon', async ({ page }) => {
        const initialName = `Test Task: Edit ${Date.now()}`;
        const editedName = `Test Task: Edited ${Date.now()}`;
        await setupTestTask(page, initialName);

        const taskItem = page.locator('.task-item', { hasText: initialName }).first();
        await taskItem.waitFor({ state: 'visible' });
        await taskItem.hover();

        const editBtn = taskItem.locator('.edit-btn');
        await editBtn.click();

        const popup = page.locator('.popup-container');
        await expect(popup).toBeVisible();

        await popup.locator('#task-text').fill(editedName);
        await popup.locator('button:text("Save Changes")').click();

        await expect(page.getByText(editedName).first()).toBeVisible({ timeout: 10000 });
    });

    test('should delete a task by dragging it to the trash basket', async ({ page }) => {
        const taskName = `Test Task: Delete ${Date.now()}`;
        await setupTestTask(page, taskName);

        const taskItem = page.locator('.task-item', { hasText: taskName }).first();
        await taskItem.scrollIntoViewIfNeeded();
        await taskItem.waitFor({ state: 'visible' });

        const trash = page.locator('.trash-basket');
        await trash.scrollIntoViewIfNeeded();
        await trash.waitFor({ state: 'visible' });

        const taskBounds = await taskItem.boundingBox();
        const trashBounds = await trash.boundingBox();

        if (taskBounds && trashBounds) {
            await dragAndDrop(page,
                { x: taskBounds.x + taskBounds.width / 2, y: taskBounds.y + taskBounds.height / 2 },
                { x: trashBounds.x + trashBounds.width / 2, y: trashBounds.y + trashBounds.height / 2 }
            );
        }

        await expect(page.getByText(taskName)).not.toBeVisible({ timeout: 10000 });
    });
});
