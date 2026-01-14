import { test, expect } from '@playwright/test'

test('debug window', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as any).__MOCK_USER__ = {
      uid: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User'
    }
  })
  await page.goto('/')
  await page.waitForFunction(() => (window as any).pinia, { timeout: 10000 })
  const keys = await page.evaluate(() => {
    const pinia = (window as any).pinia
    return Array.from(pinia._s.keys())
  })
  console.log('Registered stores:', keys)
})
