import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick, ref } from 'vue'
import DayView from '../DayView.vue'
import { useTimeStore } from '../../stores/time'

// Mock Child Components
// Mock Child Components
const mocks = vi.hoisted(() => {
	const DayColumnStub = {
		name: 'DayColumn',
		template: '<div class="day-column-stub" @click="$emit(\'slot-click\', { startTime: 10 })"></div>',
		props: ['date', 'tasks', 'startHour', 'endHour', 'taskStatuses', 'scrollTop', 'scrollLeft', 'currentTime'],
		emits: ['slot-click', 'edit']
	}

	const AddDayZoneStub = {
		name: 'AddDayZone',
		template: '<div class="add-day-zone-stub" @click="$emit(\'add-day\')"></div>',
		props: ['label'],
		emits: ['add-day']
	}

	const AppIconStub = {
		name: 'AppIcon',
		template: '<div class="app-icon-stub"></div>',
		props: ['name', 'size']
	}

	return { DayColumnStub, AddDayZoneStub, AppIconStub }
})

vi.mock('../DayColumn.vue', () => ({ default: mocks.DayColumnStub }))
vi.mock('../AddDayZone.vue', () => ({ default: mocks.AddDayZoneStub }))
vi.mock('../common/AppIcon.vue', () => ({ default: mocks.AppIconStub }))

// Mock useDragOperator
vi.mock('../../composables/useDragOperator', () => ({
	useDragOperator: () => ({
		isDragging: ref(false)
	})
}))

// Mock Date Utils (if needed for consistent dates)
// vi.mock('../utils/dateUtils', () => ({
// 	formatDate: (d: Date) => d.toISOString().split('T')[0]
// }))

describe('DayView.vue', () => {
	const defaultProps = {
		dates: ['2025-01-01', '2025-01-02'],
		tasksByDate: {
			'2025-01-01': [
				{ id: '1', text: 'Task 1', startTime: 9, duration: 60, isDeepWork: false, category: '1', completed: false, date: '2025-01-01' },
				{ id: '2', text: 'Task 2', startTime: 10, duration: 30, isDeepWork: true, category: '2', completed: false, date: '2025-01-01' }
			],
			'2025-01-02': []
		},
		startHour: 8,
		endHour: 18
	}

	const mountComponent = (props = {}) => {
		return mount(DayView, {
			props: {
				...defaultProps,
				...props
			},
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: false,
						initialState: {
							time: {
								currentTime: new Date('2025-01-01T12:00:00') // Noon
							},
							settings: {
								loading: false
							},
							appearance: {
								hourHeight: 60,
								uiScale: 1
							}
						}
					})
				],
				components: {
					DayColumn: mocks.DayColumnStub,
					AddDayZone: mocks.AddDayZoneStub,
					AppIcon: mocks.AppIconStub
				},
				stubs: {
					teleport: true
				}
			}
		})
	}

	// Mock scrollTo since it's not implemented in jsdom
	HTMLElement.prototype.scrollTo = vi.fn()

	// --- Happy Path ---

	it('renders correctly with given dates', () => {
		const wrapper = mountComponent()
		const dayColumns = wrapper.findAllComponents(mocks.DayColumnStub)
		expect(dayColumns).toHaveLength(2)
		expect(dayColumns[0].props('date')).toBe('2025-01-01')
		expect(dayColumns[1].props('date')).toBe('2025-01-02')
	})

	it('renders time labels based on startHour and endHour', () => {
		const wrapper = mountComponent({ startHour: 8, endHour: 12 })
		const labels = wrapper.findAll('.time-label:not(.current-time-label):not(.task-boundary-label)')
		// Hours: 8, 9, 10, 11 (endHour is exclusive for generation? No, checks array length)
		// Code: Array.from({ length: end - start }, (_, i) => i + start)
		// So 12-8 = 4 labels: 08:00, 09:00, 10:00, 11:00
		expect(labels).toHaveLength(4)
		expect(labels[0].text()).toContain('08:00')
	})

	it('calculates day stats correctly', async () => {
		const wrapper = mountComponent()
		// Stats are calculated for each day column header
		// Day 1: Task 1 (60m), Task 2 (30m Deep).
		// Current time 12:00. Start times 9:00, 10:00. Both are past/completed?
		// Task 1: 9-10 (completed). Task 2: 10-10.5 (completed).
		// Total: 90m (1:30). Completed: 90m (1:30).
		// Deep: 30m (0:30).

		// Wait for updates
		await nextTick()

		// Header 0 is the sticky time label header? No, .column-header is inside .day-column-outer
		// Structure: .time-labels .column-header (empty) AND .day-column-outer .column-header (with stats)
		// But in template: .time-labels > .column-header is empty.
		// .day-column-outer > .column-header has content.

		const dayHeaders = wrapper.findAll('.day-column-outer .column-header')
		expect(dayHeaders[0].text()).toContain('1:30h / 1:30h')
		expect(dayHeaders[0].text()).toContain('0:30h / 0:30h') // Deep work

		expect(dayHeaders[1].text()).toContain('0:00h / 0:00h')
	})

	it('emits add-day when AddDayZone is clicked', async () => {
		const wrapper = mountComponent()
		const addZone = wrapper.findComponent(mocks.AddDayZoneStub)
		await addZone.vm.$emit('add-day')

		expect(wrapper.emitted('add-day')).toBeTruthy()
	})

	it('scrolls to current time on mount', async () => {
		// Mock scrollTo
		const scrollToMock = vi.fn()
		HTMLElement.prototype.scrollTo = scrollToMock

		mountComponent()
		await nextTick() // Settings loading watcher handles scroll

		// Expect scrollTo to be called
		expect(scrollToMock).toHaveBeenCalled()
	})

	it('handles slot click from DayColumn', async () => {
		const wrapper = mountComponent()
		const col = wrapper.findComponent(mocks.DayColumnStub)

		// Simulate child emitting 'slot-click'
		// Logic in DayView: @slot-click="handleSlotClick($event.startTime, 0, date)"
		// Wait, DayColumn emits `slot-click` with event payload?
		// DayView template: @slot-click="handleSlotClick($event.startTime, 0, date)"
		// So event payload must have startTime property.
		await col.vm.$emit('slot-click', { startTime: 10.5 })

		expect(wrapper.emitted('create-task')).toBeTruthy()
		const emission = wrapper.emitted('create-task')![0][0] as any
		expect(emission.startTime).toBe(10.5)
		expect(emission.date).toBe('2025-01-01')
	})

	it('emits edit when DayColumn emits edit', async () => {
		const wrapper = mountComponent()
		const col = wrapper.findComponent(mocks.DayColumnStub)
		const task = { id: '1', text: 'Test', category: '1', completed: false, startTime: 9, duration: 60 }
		await col.vm.$emit('edit', task)

		expect(wrapper.emitted('edit')).toBeTruthy()
		expect(wrapper.emitted('edit')![0][0]).toEqual(task)
	})

	// --- Edge Cases ---

	it('renders correctly with no tasks', () => {
		const wrapper = mountComponent({ tasksByDate: { '2025-01-01': [] } })
		const dayHeaders = wrapper.findAll('.day-column-outer .column-header')
		expect(dayHeaders[0].text()).toContain('0:00h / 0:00h')
	})

	it('current time label hidden if outside range', async () => {
		const wrapper = mountComponent({ startHour: 9, endHour: 17 })
		const timeStore = useTimeStore()
		timeStore.currentTime = new Date('2025-01-01T08:00:00') // Before start
		await nextTick()

		const currentLabel = wrapper.find('.current-time-label')
		expect(currentLabel.exists()).toBe(false)
	})

	it('syncs scroll state', async () => {
		const wrapper = mountComponent()
		const scrollArea = wrapper.find('.calendar-scroll-area')

		// Simulate scroll
		// We need to set scrollTop on the element and trigger scroll event
		const el = scrollArea.element as HTMLElement
		el.scrollTop = 100
		el.scrollLeft = 50
		await scrollArea.trigger('scroll')

		// Check that props passed to DayColumn are updated (since DayColumnStub props are reactive if passed ref?)
		// But here props passed are number values from refs
		// The component re-renders or updates props
		await nextTick()
		const col = wrapper.findComponent(mocks.DayColumnStub)
		expect(col.props('scrollTop')).toBe(100)
		expect(col.props('scrollLeft')).toBe(50)
	})
})
