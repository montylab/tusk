import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTaskMonitor } from '../useTaskMonitor'
import { createTestingPinia } from '@pinia/testing'
import { useTasksStore } from '../../stores/tasks'
import { nerve, NERVE_EVENTS } from '../../services/nerve'

vi.mock('../../services/nerve', () => ({
	nerve: {
		on: vi.fn(),
		emit: vi.fn()
	},
	NERVE_EVENTS: {
		MINUTE_TICK: 'minute-tick',
		SCHEDULED_TASK_BEGIN: 'scheduled-task-begin',
		SCHEDULED_TASK_END: 'scheduled-task-end'
	}
}))

describe('useTaskMonitor', () => {
	let tasksStore: any

	beforeEach(() => {
		vi.clearAllMocks()
		createTestingPinia({ createSpy: vi.fn })
		tasksStore = useTasksStore()
	})

	it('emits BEGIN when task startTime matches current time', () => {
		useTaskMonitor()
		const call = vi.mocked(nerve.on).mock.calls.find((c) => c[0] === NERVE_EVENTS.MINUTE_TICK)
		const callback = call![1]

		const date = new Date('2025-01-01T10:00:00')
		tasksStore.scheduledTasks = {
			'2025-01-01': [{ id: '1', text: 'Task 1', startTime: 10, duration: 60 }]
		}

		callback({ date } as any)

		expect(nerve.emit).toHaveBeenCalledWith(
			NERVE_EVENTS.SCHEDULED_TASK_BEGIN,
			expect.objectContaining({
				title: 'Task Started'
			})
		)
	})

	it('emits END when task endTime matches current time', () => {
		useTaskMonitor()
		const call = vi.mocked(nerve.on).mock.calls.find((c) => c[0] === NERVE_EVENTS.MINUTE_TICK)
		const callback = call![1]

		// 10:00 + 60 min = 11:00
		const date = new Date('2025-01-01T11:00:00')
		tasksStore.scheduledTasks = {
			'2025-01-01': [{ id: '1', text: 'Task 1', startTime: 10, duration: 60 }]
		}

		callback({ date } as any)

		expect(nerve.emit).toHaveBeenCalledWith(
			NERVE_EVENTS.SCHEDULED_TASK_END,
			expect.objectContaining({
				title: 'Task Finished'
			})
		)
	})

	it('only emits BEGIN once for the same task instance', () => {
		useTaskMonitor()
		const call = vi.mocked(nerve.on).mock.calls.find((c) => c[0] === NERVE_EVENTS.MINUTE_TICK)
		const callback = call![1]

		const date = new Date('2025-01-01T10:00:00')
		tasksStore.scheduledTasks = {
			'2025-01-01': [{ id: '1', text: 'Task 1', startTime: 10, duration: 60 }]
		}

		callback({ date } as any)
		callback({ date } as any) // Second tick at same time (theoretically)

		expect(nerve.emit).toHaveBeenCalledTimes(1)
	})
})
