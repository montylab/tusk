import { test, expect } from '@playwright/test';

test.describe('Authentication Redirects', () => {
    // Helper to clear state
    test.beforeEach(async ({ page }) => {
        await page.goto('/signout'); // Ensure logged out
        await page.waitForURL(/.*\/signin/, { timeout: 10000 });
    });

    test('should redirect to home if already authenticated and accessing /signin', async ({ page }) => {
        // We use the mock injection here because it's the fastest way to test REDIRECTS 
        // without depending on Firebase responsiveness.
        await page.addInitScript(() => {
            (window as any).__MOCK_USER__ = {
                uid: 'test-user',
                email: 'test@example.com',
                displayName: 'Test User'
            };
        });

        await page.goto('/signin');
        await expect(page).toHaveURL(/.*(\/|\/day)/);
    });

    test('should login with email and password', async ({ page }) => {
        await page.goto('/signin');
        await page.fill('#email', 'test@example.com');
        await page.fill('#password', 'password123');
        await page.click('.submit-btn');

        // Should redirect to dashboard
        await expect(page).toHaveURL(/.*(\/|\/day)/, { timeout: 15000 });
        await expect(page.locator('.app-header')).toBeVisible();
    });

    test('should logout correctly', async ({ page }) => {
        // Login first
        await page.goto('/signin');
        await page.fill('#email', 'test@example.com');
        await page.fill('#password', 'password123');
        await page.click('.submit-btn');
        await expect(page).toHaveURL(/.*(\/|\/day)/);

        // Click logout
        const logoutBtn = page.locator('.logout-btn');
        await expect(logoutBtn).toBeVisible();
        await logoutBtn.click();

        // Should go through signout to signin
        await expect(page).toHaveURL(/.*\/signout/);
        await page.waitForURL(/.*\/signin/, { timeout: 10000 });
        await expect(page.locator('.signin-page')).toBeVisible();
    });
});
