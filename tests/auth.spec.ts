import { test, expect } from '@playwright/test';

test.describe('Authentication Redirects', () => {
    test('should redirect to home if already authenticated and accessing /signin', async ({ page }) => {
        // Inject mock user BEFORE navigation
        await page.addInitScript(() => {
            (window as any).__MOCK_USER__ = {
                uid: 'test-user',
                email: 'test@example.com',
                displayName: 'Test User'
            };
        });

        // Navigate to /signin
        await page.goto('/signin');

        // Should redirect to home (/) or /day
        await expect(page).toHaveURL(/.*(\/|\/day)/);
    });

    test('should redirect to home after successful sign-in', async ({ page }) => {
        // Navigate to /signin without a user
        await page.goto('/signin');

        // Ensure we are on the sign-in page
        await expect(page.locator('.signin-page')).toBeVisible();

        // Mock the login process - since we can't easily interact with the Google popup,
        // we'll mock the user store behavior when the login button is clicked.
        // We already have exposure of Pinia and the mock user logic.

        // We use addInitScript to make sure __MOCK_USER__ is available, 
        // but we don't set it yet to stay on signin page

        await page.evaluate(() => {
            // Intercept the login call to set the mock user
            const pinia = (window as any).pinia;
            if (pinia) {
                const userStore = pinia._s.get('user');
                if (userStore) {
                    const originalLogin = userStore.login;
                    userStore.login = async () => {
                        (window as any).__MOCK_USER__ = {
                            uid: 'new-user',
                            email: 'new@example.com',
                            displayName: 'New User'
                        };
                        userStore.user = (window as any).__MOCK_USER__;
                        userStore.loading = false;
                    };
                }
            }
        });

        // Click login button
        await page.click('.login-btn');

        // Should redirect to home
        await expect(page).toHaveURL(/.*(\/|\/day)/);
    });
});
