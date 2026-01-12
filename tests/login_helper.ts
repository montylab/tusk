import { expect, Page } from '@playwright/test';

export async function loginTestUser(page: Page) {
    await page.goto('/signin');

    // Check if already logged in (redirected to /)
    if (!page.url().includes('/signin')) {
        return;
    }

    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('.submit-btn');

    // Wait a bit to see if we get an error or redirect
    try {
        await expect(page).toHaveURL(/.*(\/|\/day)/, { timeout: 5000 });
    } catch (e) {
        // If we are still on signin, maybe user doesn't exist? Try Sign Up
        const error = await page.locator('.error-text').textContent();
        if (error) {
            console.log('Login failed, trying to sign up:', error);
            // Click the toggle button to switch to Sign Up mode
            await page.click('.text-link');
            // Wait for the button text to change to "Create Account" or similar if needed, 
            // but just clicking .submit-btn again should work as it's the same form.
            await page.click('.submit-btn');
            await expect(page).toHaveURL(/.*(\/|\/day)/, { timeout: 15000 });
        } else {
            throw e;
        }
    }
}
