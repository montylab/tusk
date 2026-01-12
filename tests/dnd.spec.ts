import { test, expect, Page } from '@playwright/test';
import { loginTestUser } from './login_helper';

test.describe('Drag and Drop & Resize', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
        // Ensure clean state
        await page.goto('/signout');
        await page.waitForURL(/.*\/signin/);

        // Login with real test user flow
        await loginTestUser(page);

        // Wait for app to be ready
        await expect(page.locator('.app-header')).toBeVisible({ timeout: 15000 });

        // CREATE a real task via the store actions
        const taskName = `Test Task ${Date.now()}`;
        await page.evaluate(async (name) => {
            const win = window as any;
            const tasksStore = win.pinia._s.get('tasks');
            const today = tasksStore.currentDates[0];

            await tasksStore.createScheduledTask({
                text: name,
                category: 'Work',
                completed: false,
                startTime: 10,
                duration: 60,
                date: today,
                isShortcut: false
            });
        }, taskName);

        // Wait for the task to appear in the UI (it will sync back from Firebase)
        await expect(page.getByText(taskName)).toBeVisible({ timeout: 15000 });
    });

    // Cleanup after each test to keep DB clean-ish
    test.afterEach(async ({ page }) => {
        await page.evaluate(async () => {
            const win = window as any;
            const tasksStore = win.pinia._s.get('tasks');
            const today = tasksStore.currentDates[0];

            // Delete all test tasks
            const tasks = tasksStore.calendarTasksState[today] || [];
            for (const t of tasks) {
                if (t.text.startsWith('Test Task')) {
                    await tasksStore.deleteScheduledTask(t.id, today);
                }
            }
        });
    });

    test('should drag task to a new time', async ({ page }: { page: Page }) => {
        const task = page.locator('.task-wrapper-absolute').first();
        const taskBox = await task.boundingBox();
        if (!taskBox) throw new Error('Task box not found');

        const startX = taskBox.x + taskBox.width / 2;
        const startY = taskBox.y + taskBox.height / 2;
        const targetY = startY + 160; // +2 hours

        // Listen for the update call by spying on the store action
        await page.evaluate(() => {
            const win = window as any;
            const tasksStore = win.pinia._s.get('tasks');
            win.__LAST_UPDATE__ = null;

            const originalUpdate = tasksStore.updateScheduledTask;
            tasksStore.updateScheduledTask = async (...args: any[]) => {
                win.__LAST_UPDATE__ = { id: args[0], date: args[1], updates: args[2] };
                return originalUpdate.apply(tasksStore, args);
            };
        });

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX, targetY, { steps: 10 });
        await page.mouse.up();

        // Wait for the spy to catch the update
        await expect.poll(async () => {
            return await page.evaluate(() => (window as any).__LAST_UPDATE__);
        }, { timeout: 10000 }).not.toBeNull();

        const lastUpdate = await page.evaluate(() => (window as any).__LAST_UPDATE__);
        expect(lastUpdate.updates.startTime).toBe(12);
    });

    test('should resize task from bottom', async ({ page }: { page: Page }) => {
        const task = page.locator('.task-wrapper-absolute').first();
        const resizeHandle = task.locator('.resize-handle.bottom');

        await resizeHandle.waitFor({ state: 'visible' });
        const handleBox = await resizeHandle.boundingBox();
        if (!handleBox) throw new Error('Handle box not found');

        const startX = handleBox.x + handleBox.width / 2;
        const startY = handleBox.y + handleBox.height / 2;
        const targetY = startY + 80; // +1 hour

        await page.evaluate(() => {
            const win = window as any;
            const tasksStore = win.pinia._s.get('tasks');
            win.__LAST_UPDATE__ = null;

            const originalUpdate = tasksStore.updateScheduledTask;
            tasksStore.updateScheduledTask = async (...args: any[]) => {
                win.__LAST_UPDATE__ = { id: args[0], date: args[1], updates: args[2] };
                return originalUpdate.apply(tasksStore, args);
            };
        });

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX, targetY, { steps: 10 });
        await page.mouse.up();

        await expect.poll(async () => {
            return await page.evaluate(() => (window as any).__LAST_UPDATE__);
        }, { timeout: 10000 }).not.toBeNull();

        const lastUpdate = await page.evaluate(() => (window as any).__LAST_UPDATE__);
        expect(lastUpdate.updates.duration).toBe(120);
    });
});
