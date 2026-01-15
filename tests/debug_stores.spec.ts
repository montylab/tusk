import { test, expect } from '@playwright/test'
import { loginTestUser } from './login_helper'
// @ts-ignore
import { testUsers } from './test-users.js'

test('debug window', async ({ page }) => {
	const primaryUser = testUsers[0]
	await loginTestUser(page, primaryUser.email, primaryUser.password)
	await page.goto('/')
	await page.waitForFunction(() => (window as any).pinia, { timeout: 10000 })
	const keys = await page.evaluate(() => {
		const pinia = (window as any).pinia
		return Array.from(pinia._s.keys())
	})
	console.log('Registered stores:', keys)
})
