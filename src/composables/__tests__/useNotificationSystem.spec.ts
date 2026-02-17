import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNotificationSystem } from '../useNotificationSystem'
import { createTestingPinia } from '@pinia/testing'
import { nerve, NERVE_EVENTS } from '../../services/nerve'
import { useSettingsStore } from '../../stores/settings'

// Mock nerve
vi.mock('../../services/nerve', () => ({
	nerve: {
		on: vi.fn(),
		off: vi.fn(),
		emit: vi.fn()
	},
	NERVE_EVENTS: {
		SCHEDULED_TASK_BEGIN: 'scheduled-task-begin',
		SCHEDULED_TASK_END: 'scheduled-task-end'
	}
}))

describe('useNotificationSystem', () => {
	let settingsStore: any
	let mockNotification: any

	beforeEach(() => {
		vi.clearAllMocks()
		createTestingPinia({ createSpy: vi.fn })
		settingsStore = useSettingsStore()

		// Mock window.Notification
		mockNotification = vi.fn()
		;(mockNotification as any).permission = 'granted'
		;(mockNotification as any).requestPermission = vi.fn().mockResolvedValue('granted')
		vi.stubGlobal('Notification', mockNotification)

		// Default settings
		settingsStore.settings = {
			notifications: {
				enabled: true,
				taskStarted: true,
				taskEnded: true
			}
		}
	})

	it('requests permission on init if default', () => {
		;(Notification as any).permission = 'default'
		useNotificationSystem()
		expect(Notification.requestPermission).toHaveBeenCalled()
	})

	it('shows notification when task begins', () => {
		useNotificationSystem()

		// Find the callback passed to nerve.on
		const call = vi.mocked(nerve.on).mock.calls.find((c) => c[0] === NERVE_EVENTS.SCHEDULED_TASK_BEGIN)
		const callback = call![1]

		callback({ title: 'Task Start', body: 'Go!' } as any)

		expect(mockNotification).toHaveBeenCalledWith(
			'Task Start',
			expect.objectContaining({
				body: 'Go!'
			})
		)
	})

	it('does not show notification if disabled in settings', () => {
		settingsStore.settings.notifications.enabled = false
		useNotificationSystem()

		const call = vi.mocked(nerve.on).mock.calls.find((c) => c[0] === NERVE_EVENTS.SCHEDULED_TASK_BEGIN)
		const callback = call![1]
		callback({ title: 'Task Start', body: 'Go!' } as any)

		expect(mockNotification).not.toHaveBeenCalled()
	})

	it('shows notification when task ends', () => {
		useNotificationSystem()

		const call = vi.mocked(nerve.on).mock.calls.find((c) => c[0] === NERVE_EVENTS.SCHEDULED_TASK_END)
		const callback = call![1]
		callback({ title: 'Task End', body: 'Done!' } as any)

		expect(mockNotification).toHaveBeenCalledWith(
			'Task End',
			expect.objectContaining({
				body: 'Done!'
			})
		)
	})
})
