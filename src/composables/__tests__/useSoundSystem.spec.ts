import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSoundSystem } from '../useSoundSystem'
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
		TASK_DELETED: 'task-deleted',
		SCHEDULED_TASK_BEGIN: 'scheduled-task-begin',
		SCHEDULED_TASK_END: 'scheduled-task-end'
	}
}))

// Mock Howler
const { mockPlay } = vi.hoisted(() => ({
	mockPlay: vi.fn()
}))

vi.mock('howler', () => ({
	Howl: vi.fn().mockImplementation(function () {
		return {
			play: mockPlay
		}
	})
}))

describe('useSoundSystem', () => {
	let settingsStore: any

	beforeEach(() => {
		vi.clearAllMocks()
		createTestingPinia({ createSpy: vi.fn })
		settingsStore = useSettingsStore()

		// Default settings
		settingsStore.settings = {
			sounds: {
				enabled: true,
				taskDeleted: true,
				taskStarted: true,
				taskEnded: true
			}
		}
	})

	it('plays sound when task deleted', () => {
		useSoundSystem()

		const call = vi.mocked(nerve.on).mock.calls.find((c) => c[0] === NERVE_EVENTS.TASK_DELETED)
		const callback = call![1]

		callback({} as any)
		expect(mockPlay).toHaveBeenCalled()
	})

	it('does not play sound if disabled in settings', () => {
		settingsStore.settings.sounds.enabled = false
		useSoundSystem()

		const call = vi.mocked(nerve.on).mock.calls.find((c) => c[0] === NERVE_EVENTS.TASK_DELETED)
		const callback = call![1]

		callback({} as any)
		expect(mockPlay).not.toHaveBeenCalled()
	})

	it('plays sound when task begins', () => {
		useSoundSystem()

		const call = vi.mocked(nerve.on).mock.calls.find((c) => c[0] === NERVE_EVENTS.SCHEDULED_TASK_BEGIN)
		const callback = call![1]

		callback({} as any)
		expect(mockPlay).toHaveBeenCalled()
	})

	it('plays sound when task ends', () => {
		useSoundSystem()

		const call = vi.mocked(nerve.on).mock.calls.find((c) => c[0] === NERVE_EVENTS.SCHEDULED_TASK_END)
		const callback = call![1]

		callback({} as any)
		expect(mockPlay).toHaveBeenCalled()
	})
})
