import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import DayColumn from '../DayColumn.vue'
import type { Task } from '../../types'

// --- Mocks ---

const mockStartDrag = vi.fn()
const mockRegisterZone = vi.fn()
const mockUnregisterZone = vi.fn()
const mockUpdateZoneBounds = vi.fn()
const mockActiveDraggedTaskId = ref<string | number | null>(null)
const mockDragOffset = ref({ x: 0, y: 0 })

vi.mock('../../composables/useDragOperator', () => ({
	useDragOperator: () => ({
		activeDraggedTaskId: mockActiveDraggedTaskId,
		registerZone: mockRegisterZone,
		unregisterZone: mockUnregisterZone,
		updateZoneBounds: mockUpdateZoneBounds,
		startDrag: mockStartDrag,
		dragOffset: mockDragOffset
	})
}))

vi.mock('../../composables/useTaskLayout', () => ({
	useTaskLayout: (tasksFn: any) => {
		const { computed } = require('vue')
		return {
			layoutTasks: computed(() => {
				const tasks = typeof tasksFn === 'function' ? tasksFn() : tasksFn.value || []
				return tasks.map((t: Task) => ({
					...t,
					style: {
						top: '0px',
						height: '60px',
						left: '0%',
						width: '100%',
						position: 'absolute' as const,
						zIndex: 10
					},
					isOverlapping: false
				}))
			})
		}
	}
}))

vi.mock('../../utils/dateUtils', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../../utils/dateUtils')>()
	return {
		...actual,
		isTimePast: (dateStr: string, hour: number, now: Date) => {
			const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
			if (dateStr < todayStr) return true
			if (dateStr > todayStr) return false
			const nowHour = now.getHours() + now.getMinutes() / 60
			return hour < nowHour
		}
	}
})

// ResizeObserver polyfill for jsdom
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as any

// Stub getBoundingClientRect for jsdom
Element.prototype.getBoundingClientRect = vi.fn(() => ({
	x: 0,
	y: 0,
	width: 200,
	height: 400,
	top: 0,
	right: 200,
	bottom: 400,
	left: 0,
	toJSON: () => {}
}))

// Helper
function makeTask(overrides: Partial<Task> = {}): Task {
	return {
		id: 'task-1',
		text: 'Test Task',
		category: 'work',
		completed: false,
		startTime: 9,
		duration: 60,
		date: '2026-01-01',
		...overrides
	}
}

const baseProps = {
	date: '2026-01-01',
	tasks: [] as Task[],
	startHour: 8,
	endHour: 12,
	taskStatuses: {} as Record<string | number, 'past' | 'future' | 'on-air' | null>,
	currentTime: new Date('2026-01-01T10:30:00')
}

describe('DayColumn.vue', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
		vi.clearAllMocks()
		mockActiveDraggedTaskId.value = null
	})

	// --- Happy Path ---

	it('renders the correct number of hour rows', () => {
		const wrapper = mount(DayColumn, { props: baseProps })
		const hourRows = wrapper.findAll('.hour-row')
		expect(hourRows).toHaveLength(4) // hours 8, 9, 10, 11
	})

	it('renders 4 quarter-slots per hour row', () => {
		const wrapper = mount(DayColumn, { props: baseProps })
		const firstRow = wrapper.find('.hour-row')
		const quarters = firstRow.findAll('.quarter-slot')
		expect(quarters).toHaveLength(4)
	})

	it('renders tasks when provided', () => {
		const task = makeTask()
		const wrapper = mount(DayColumn, {
			props: {
				...baseProps,
				tasks: [task],
				taskStatuses: { 'task-1': 'future' }
			}
		})
		expect(wrapper.findAll('.task-wrapper-absolute')).toHaveLength(1)
	})

	it('emits slot-click with correct startTime on quarter click', async () => {
		const wrapper = mount(DayColumn, { props: baseProps })
		// Click the second quarter of the first hour row (hour 8, q=1 => 8.25)
		const hourRows = wrapper.findAll('.hour-row')
		const quarters = hourRows[0].findAll('.quarter-slot')
		await quarters[1].trigger('click')
		expect(wrapper.emitted('slot-click')).toBeTruthy()
		expect(wrapper.emitted('slot-click')![0]).toEqual([{ startTime: 8.25 }])
	})

	// --- Edge Cases ---

	it('renders grid with no tasks', () => {
		const wrapper = mount(DayColumn, { props: baseProps })
		const container = wrapper.find('.tasks-container')
		expect(container.exists()).toBe(true)
		expect(wrapper.findAll('.task-wrapper-absolute')).toHaveLength(0)
	})

	it('applies is-past class to past time slots', () => {
		// currentTime is 10:30, so hour 9 quarter 0 (= 9.0) is in the past
		const wrapper = mount(DayColumn, { props: baseProps })
		const hourRows = wrapper.findAll('.hour-row')
		// hour 9 is the second row (index 1), quarter 0 is first child
		const pastQuarter = hourRows[1].findAll('.quarter-slot')[0]
		expect(pastQuarter.classes()).toContain('is-past')
	})

	it('does NOT apply is-past class to future time slots', () => {
		// currentTime is 10:30, so hour 11 quarter 0 (= 11.0) is in the future
		const wrapper = mount(DayColumn, { props: baseProps })
		const hourRows = wrapper.findAll('.hour-row')
		// hour 11 is the last row (index 3), quarter 0
		const futureQuarter = hourRows[3].findAll('.quarter-slot')[0]
		expect(futureQuarter.classes()).not.toContain('is-past')
	})

	it('calls startDrag with duplicate task on Ctrl+Click', async () => {
		const task = makeTask()
		const wrapper = mount(DayColumn, {
			props: {
				...baseProps,
				tasks: [task],
				taskStatuses: { 'task-1': 'future' }
			}
		})

		const taskWrapper = wrapper.find('.task-wrapper-absolute')
		await taskWrapper.trigger('mousedown', { ctrlKey: true })

		expect(mockStartDrag).toHaveBeenCalledTimes(1)
		const calledTask = mockStartDrag.mock.calls[0][0]
		// Duplicate task should have a different id
		expect(calledTask.id).not.toBe(task.id)
	})

	it('calls startDrag with original task on normal mousedown', async () => {
		const task = makeTask()
		const wrapper = mount(DayColumn, {
			props: {
				...baseProps,
				tasks: [task],
				taskStatuses: { 'task-1': 'future' }
			}
		})

		const taskWrapper = wrapper.find('.task-wrapper-absolute')
		await taskWrapper.trigger('mousedown')

		expect(mockStartDrag).toHaveBeenCalledTimes(1)
		const calledTask = mockStartDrag.mock.calls[0][0]
		expect(calledTask.id).toBe(task.id)
	})

	// --- UI/Interaction ---

	it('applies dragged-origin class when task is being dragged', () => {
		const task = makeTask()
		mockActiveDraggedTaskId.value = 'task-1'

		const wrapper = mount(DayColumn, {
			props: {
				...baseProps,
				tasks: [task],
				taskStatuses: { 'task-1': 'future' }
			}
		})

		const taskWrapper = wrapper.find('.task-wrapper-absolute')
		expect(taskWrapper.classes()).toContain('dragged-origin')
	})

	it('does NOT apply dragged-origin class for non-dragged tasks', () => {
		const task = makeTask()
		mockActiveDraggedTaskId.value = 'other-task'

		const wrapper = mount(DayColumn, {
			props: {
				...baseProps,
				tasks: [task],
				taskStatuses: { 'task-1': 'future' }
			}
		})

		const taskWrapper = wrapper.find('.task-wrapper-absolute')
		expect(taskWrapper.classes()).not.toContain('dragged-origin')
	})

	it('calls registerZone on mount', () => {
		mount(DayColumn, { props: baseProps })
		expect(mockRegisterZone).toHaveBeenCalledTimes(1)
		expect(mockRegisterZone.mock.calls[0][0]).toBe('calendar-day-2026-01-01')
	})

	it('calls unregisterZone on unmount', () => {
		const wrapper = mount(DayColumn, { props: baseProps })
		wrapper.unmount()
		expect(mockUnregisterZone).toHaveBeenCalledWith('calendar-day-2026-01-01')
	})
})
