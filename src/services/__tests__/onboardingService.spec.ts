import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runOnboarding } from '../onboardingService'
import * as firebaseService from '../firebaseService'
import { useSettingsStore } from '../../stores/settings'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../firebaseService', () => ({
	createCategory: vi.fn(() => Promise.resolve({ id: 'cat-id' })),
	createTaskInPath: vi.fn(() => Promise.resolve({ id: 'task-id' })),
	updateSettings: vi.fn(() => Promise.resolve())
}))

describe('onboardingService', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
		vi.clearAllMocks()
	})

	it('should create categories and tasks and mark as onboarded', async () => {
		const settingsStore = useSettingsStore()
		const updateSettingsSpy = vi.spyOn(settingsStore, 'updateSettings')

		await runOnboarding()

		// Verify categories created
		expect(firebaseService.createCategory).toHaveBeenCalled()

		// Verify tasks created
		// We expect some tasks to be shifted if baseTime + offset < 0
		// In the mock, current time is used, so results vary by run time, but we can check the logic calls
		expect(firebaseService.createTaskInPath).toHaveBeenCalledWith(expect.stringMatching(/calendar\//), expect.any(Object))
		expect(firebaseService.createTaskInPath).toHaveBeenCalledWith('todo', expect.any(Object))
		expect(firebaseService.createTaskInPath).toHaveBeenCalledWith('shortcuts', expect.any(Object))

		// Check if any call used yesterday's date (if applicable)
		const calls = (firebaseService.createTaskInPath as any).mock.calls
		const calendarCalls = calls.filter((c: any) => c[0].startsWith('calendar/'))
		expect(calendarCalls.length).toBeGreaterThan(0)

		// Verify settings updated
		expect(updateSettingsSpy).toHaveBeenCalledWith({ onboarded: true })
	})
})
