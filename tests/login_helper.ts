import { expect, Page } from '@playwright/test'
// @ts-ignore
import { testUsers } from './test-users.js'

export async function loginTestUser(page: Page, email = testUsers[0].email, password = testUsers[0].password) {
	// 1. Force navigation to signin. If we are on /signout, we need to wait for redirect or go directly.
	await page.goto('/signin')
	await page.waitForLoadState('load')

	// If already at /day or home, we're likely logged in.
	let url = page.url()
	if (url.endsWith('/day') || (url.endsWith('/') && !url.includes('signin') && !url.includes('signout'))) {
		return
	}

	// Double check we are actually on signin page (Handle case where we are stuck on /signout)
	if (url.includes('signout')) {
		await page.waitForURL(/.*signin/, { timeout: 10000 })
	}

	const emailInput = page.locator('#email')
	const passwordInput = page.locator('#password')
	const submitBtn = page.locator('.submit-btn')

	// Ensure form is ready
	await expect(emailInput).toBeVisible({ timeout: 10000 })

	await emailInput.fill(email)
	await passwordInput.fill(password)
	await submitBtn.click()

	// 3. Handle result
	try {
		// Wait for the app-header to appear - this is the best indicator of a successful login
		await expect(page.locator('.app-header')).toBeVisible({ timeout: 15000 })
	} catch (err) {
		const errorLocator = page.locator('.error-text')
		if (await errorLocator.isVisible({ timeout: 2000 })) {
			const errorText = await errorLocator.textContent()
			if (errorText && (errorText.toLowerCase().includes('not found') || errorText.toLowerCase().includes('user-not-found'))) {
				await page.locator('.text-link').click() // Switch mode
				await page.waitForTimeout(500)
				await submitBtn.click()
				await expect(page.locator('.app-header')).toBeVisible({ timeout: 15000 })
			} else {
				throw err
			}
		} else {
			throw err
		}
	}

	// 4. Cleanup/Sync
	await page.waitForLoadState('networkidle')
	await page.waitForTimeout(500)
}
