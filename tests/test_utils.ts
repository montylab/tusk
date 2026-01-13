import { expect, Page } from '@playwright/test';

export async function setupTestTask(page: Page, text: string, options: {
    startTime?: number,
    duration?: number,
    isShortcut?: boolean,
    isTodo?: boolean
} = {}) {
    await page.evaluate(async ({ text, options }) => {
        try {
            const win = window as any;
            if (!win.pinia) throw new Error('Pinia not found on window');

            // Wait for store to be registered if needed
            const getStore = () => {
                if (win.pinia._s.has('tasks')) return win.pinia._s.get('tasks');
                // Fallback for different pinia versions/structures
                if (win.pinia._s['tasks']) return win.pinia._s['tasks'];
                return null;
            };

            let tasksStore = getStore();
            if (!tasksStore) {
                console.log('Available stores:', Array.from(win.pinia._s.keys?.() || Object.keys(win.pinia._s)));
                throw new Error('Tasks store not found in Pinia. Available: ' + JSON.stringify(Array.from(win.pinia._s.keys?.() || Object.keys(win.pinia._s))));
            }


            const today = tasksStore.currentDates?.[0];
            if (!today && !options.isTodo && !options.isShortcut) {
                console.error('currentDates is empty in tasksStore');
                throw new Error('No current date found in store for scheduled task');
            }

            if (options.isTodo) {
                await tasksStore.createTodo({ text, category: 'Work', completed: false });
            } else if (options.isShortcut) {
                await tasksStore.createShortcut({ text, category: 'Work', completed: false });
            } else {
                await tasksStore.createScheduledTask({
                    text,
                    category: 'Work',
                    completed: false,
                    startTime: options.startTime ?? 10,
                    duration: options.duration ?? 60,
                    date: today,
                    isShortcut: false
                });

            }
        } catch (e: any) {
            console.error('setupTestTask failed:', e);
            throw { message: e.message, stack: e.stack };
        }
    }, { text, options });


    page.getByText(text).scrollIntoViewIfNeeded()

    // Wait for the task to appear in the UI
    await expect(page.getByText(text)).toBeVisible({ timeout: 15000 });
}

export async function cleanupTestTasks(page: Page) {
    await page.evaluate(async () => {
        try {
            const win = window as any;
            if (!win.pinia) return;

            const getStore = () => {
                if (win.pinia._s.has('tasks')) return win.pinia._s.get('tasks');
                if (win.pinia._s['tasks']) return win.pinia._s['tasks'];
                return null;
            };

            const tasksStore = getStore();
            if (!tasksStore) return;

            console.log('--- Cleanup Start ---');

            // Wait for sync
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 1. Calendar tasks (Using the exported scheduledTasks getter)
            const scheduled = tasksStore.scheduledTasks || {};
            const dates = Object.keys(scheduled);
            for (const date of dates) {
                const tasks = [...(scheduled[date] || [])];
                for (const t of tasks) {
                    await tasksStore.deleteScheduledTask(t.id, date);
                }
            }

            // 2. Todo tasks
            const todos = [...(tasksStore.todoTasks || [])];
            for (const t of todos) {
                await tasksStore.deleteTodo(t.id);
            }

            // 3. Shortcut tasks
            const shortcuts = [...(tasksStore.shortcutTasks || [])];
            for (const t of shortcuts) {
                await tasksStore.deleteShortcut(t.id);
            }

            // Internal wait for state to reflect the deletion
            for (let i = 0; i < 20; i++) {
                const count = (tasksStore.tasks || []).length;
                if (count === 0) break;
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            console.log('--- Cleanup End ---');
        } catch (e) {
            console.error('cleanupTestTasks failed:', e);
        }
    });
}




export async function spyOnStoreAction(page: Page, storeId: string, actionName: string) {
    await page.evaluate(({ storeId, actionName }) => {
        const win = window as any;
        const store = win.pinia._s.get(storeId);
        win.__LAST_ACTION_CALL__ = null;

        const originalAction = store[actionName];
        store[actionName] = async (...args: any[]) => {
            win.__LAST_ACTION_CALL__ = { args };
            return originalAction.apply(store, args);
        };
    }, { storeId, actionName });
}

export async function waitForStoreAction(page: Page) {
    return await expect.poll(async () => {
        return await page.evaluate(() => (window as any).__LAST_ACTION_CALL__);
    }, { timeout: 10000 }).not.toBeNull();
}

export async function getLastStoreActionCall(page: Page) {
    return await page.evaluate(() => (window as any).__LAST_ACTION_CALL__);
}

export async function dragAndDrop(page: Page, from: { x: number, y: number }, to: { x: number, y: number }, steps = 40) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.waitForTimeout(200); // Wait for drag initialization
    await page.mouse.move(to.x, to.y, { steps });
    await page.mouse.up();
}

export async function loginWithCredentials(page: Page, email: string, password: string) {
    await page.goto('/signin');
    if (!page.url().includes('/signin')) return;

    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('.submit-btn');

    try {
        await expect(page).toHaveURL(/.*(\/|\/day)/, { timeout: 10000 });
    } catch (e) {
        const error = await page.locator('.error-text').textContent();
        if (error) {
            await page.click('.text-link'); // Switch to signup
            await page.click('.submit-btn');
            await expect(page).toHaveURL(/.*(\/|\/day)/, { timeout: 15000 });
        } else {
            throw e;
        }
    }
}

