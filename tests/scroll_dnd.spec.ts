import { test, expect } from '@playwright/test';
import { loginTestUser } from './login_helper';
import { setupTestTask, cleanupTestTasks, dragAndDrop } from './test_utils';
// @ts-ignore
import { testUsers } from './test-users.js';

test.describe('Horizontal Scroll Drag & Drop', () => {
    // Increase timeout for multi-step setup
    test.setTimeout(60000);
    const primaryUser = testUsers[0];

    test.beforeEach(async ({ page }) => {
        await loginTestUser(page, primaryUser.email, primaryUser.password);
        await cleanupTestTasks(page);
    });

    test.afterEach(async ({ page }) => {
        await cleanupTestTasks(page);
    });

    test('should correctly drop task when calendar is scrolled horizontally', async ({ page }) => {
        // 1. Add 5 days to creaete horizontal overflow
        const addDayBtn = page.locator('.add-day-zone');
        await expect(addDayBtn).toBeVisible();
        for (let i = 0; i < 5; i++) {
            await addDayBtn.click();
            await page.waitForTimeout(200); // Wait for render
        }

        // 2. Create a To-Do task
        const taskName = `Scroll Test Task ${Date.now()}`;
        await setupTestTask(page, taskName, { isTodo: true });

        const todoPile = page.locator('.task-pile:has-text("To Do")');
        const taskItem = todoPile.locator('.task-item').filter({ hasText: taskName }).first();
        await expect(taskItem).toBeVisible();

        // 3. Scroll to the Right, then BACK to Left
        const scrollArea = page.locator('.calendar-scroll-area');

        // Scroll right first to force offset changes
        await scrollArea.evaluate((el) => {
            el.scrollLeft = el.scrollWidth;
            el.dispatchEvent(new Event('scroll'));
        });
        await page.waitForTimeout(500);

        // Scroll back to left (start)
        await scrollArea.evaluate((el) => {
            el.scrollLeft = 0;
            el.dispatchEvent(new Event('scroll'));
        });
        await page.waitForTimeout(500);

        // 4. Identify the target: The FIRST day column
        const columns = page.locator('.day-column');
        const count = await columns.count();
        expect(count).toBeGreaterThan(4);

        const targetColumn = columns.first();
        // Target 10 AM slot (index 40: 10 * 4)
        const targetSlot = targetColumn.locator('.quarter-slot').nth(40);

        // Ensure inputs are visible
        await targetSlot.scrollIntoViewIfNeeded();

        const taskBox = await taskItem.boundingBox();
        const slotBox = await targetSlot.boundingBox();

        if (!taskBox || !slotBox) {
            throw new Error('Bounding box not found');
        }


        // Perform drag manually
        const fromX = taskBox.x + taskBox.width / 3;
        const fromY = taskBox.y + taskBox.height / 3;
        const toX = slotBox.x + slotBox.width / 2;
        const toY = slotBox.y + slotBox.height / 2;

        console.log({ fromX, fromY, toX, toY })

        await page.mouse.move(fromX, fromY);
        await page.mouse.down();
        await page.waitForTimeout(500);
        await page.mouse.move(toX, toY, { steps: 50 });
        await page.waitForTimeout(500); // Hover
        await page.mouse.up();

        await page.waitForTimeout(1000);

        // 5. Assert: Task should be on the correct day (the first one)
        const firstColumnTasks = columns.first().locator('.task-wrapper-absolute').filter({ hasText: taskName });

        // Expect task to be present in the first column
        await expect(firstColumnTasks).toBeVisible();
    });
});
