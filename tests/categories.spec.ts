import { test, expect } from '@playwright/test';
import { loginTestUser } from './login_helper';
// @ts-ignore
import { testUsers } from './test-users.js';

test.describe('Category Management', () => {
    const primaryUser = testUsers[0];

    test.beforeEach(async ({ page }) => {
        await loginTestUser(page, primaryUser.email, primaryUser.password);
        await page.goto('/settings');
        // Wait for CategoriesManager to be checked
        await expect(page.locator('.categories-manager')).toBeVisible();
    });

    test('should create a new category', async ({ page }) => {
        const categoryName = `Test Category ${Date.now()}`;

        // Find input and type name
        await page.locator('.name-input').fill(categoryName);

        // Click Add
        await page.getByRole('button', { name: 'Add Category' }).click();

        // Wait for the category to be added and verify it appears in the list
        await page.waitForTimeout(500); // Allow time for Firebase to add the category
        await expect(page.locator(`input[value="${categoryName}"]`)).toBeVisible({ timeout: 5000 });
    });

    test('should edit an existing category name', async ({ page }) => {
        const categoryName = `Edit Me ${Date.now()}`;
        const newName = `Edited ${Date.now()}`;

        // Create first
        await page.locator('.name-input').fill(categoryName);
        await page.getByRole('button', { name: 'Add Category' }).click();

        // Wait for category to be added
        await page.waitForTimeout(500);
        const nameInput = page.locator(`input[value="${categoryName}"]`);
        await expect(nameInput).toBeVisible({ timeout: 5000 });

        // Clear and type new name
        await nameInput.fill(newName);
        // Press Enter to trigger save (this avoids locator issues if the value attribute changes)
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500); // Wait for Firebase update

        // Reload page to verify persistence
        await page.reload();
        await expect(page.locator('.categories-manager')).toBeVisible({ timeout: 5000 });

        // Check if new name is present
        await expect(page.locator(`input[value="${newName}"]`)).toBeVisible();
    });

    test('should delete a category', async ({ page }) => {
        const categoryName = `Delete Me ${Date.now()}`;

        // Create
        await page.locator('.name-input').fill(categoryName);
        await page.getByRole('button', { name: 'Add Category' }).click();

        // Wait for category to be added
        await page.waitForTimeout(500);
        const categoryCard = page.locator('.category-item-card').filter({ has: page.locator(`input[value="${categoryName}"]`) });
        await expect(categoryCard).toBeVisible({ timeout: 5000 });

        // Setup dialog handler
        page.once('dialog', async dialog => {
            await dialog.accept();
        });

        // Click delete button within that card
        await categoryCard.locator('button[title="Delete Category"]').click();

        // Wait for deletion to complete
        await page.waitForTimeout(500);
        await expect(page.locator(`input[value="${categoryName}"]`)).not.toBeVisible({ timeout: 5000 });
    });

    test('should toggle deep work status', async ({ page }) => {
        const categoryName = `Deep Work ${Date.now()}`;

        // Create with Deep Work unchecked (default)
        await page.locator('.name-input').fill(categoryName);
        await page.getByRole('button', { name: 'Add Category' }).click();

        // Wait for category to be added
        await page.waitForTimeout(500);
        const categoryCard = page.locator('.category-item-card').filter({ has: page.locator(`input[value="${categoryName}"]`) });

        // Find checkbox
        const checkbox = categoryCard.locator('.item-deep-work input[type="checkbox"]');

        // Check it
        await checkbox.check();

        // Wait for checkbox update
        await page.waitForTimeout(500);

        // Reload to verify persistence
        await page.reload();
        await expect(page.locator('.categories-manager')).toBeVisible({ timeout: 5000 });

        // Re-find the card and checkbox
        const reloadedCard = page.locator('.category-item-card').filter({ has: page.locator(`input[value="${categoryName}"]`) });
        const reloadedCheckbox = reloadedCard.locator('.item-deep-work input[type="checkbox"]');

        await expect(reloadedCheckbox).toBeChecked();
    });
});
