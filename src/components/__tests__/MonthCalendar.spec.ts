import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import MonthCalendar from '../MonthCalendar.vue'
import { useTasksStore } from '../../stores/tasks'

vi.mock('../../utils/dateUtils', async () => {
	const actual = await vi.importActual('../../utils/dateUtils')
	return {
		...actual,
		getMonthCalendarGrid: vi.fn(() => [
			['2025-01-01', '2025-01-02', '2025-01-03', '2025-01-04', '2025-01-05', '2025-01-06', '2025-01-07'],
			['2025-01-08', '2025-01-09', '2025-01-10', '2025-01-11', '2025-01-12', '2025-01-13', '2025-01-14']
		]),
		getMonthName: vi.fn(() => 'January'),
		getShortDayName: vi.fn((i) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i])
	}
})

// Mock Subcomponents
const MonthDayCellStub = {
	name: 'MonthDayCell',
	template: '<div class="month-day-cell-stub" @click="$emit(\'create\', date)"></div>',
	props: ['date', 'tasks', 'currentMonth'],
	emits: ['create', 'task-click', 'task-dblclick', 'task-dragstart', 'drop']
}

const MonthTaskPopoverStub = {
	name: 'MonthTaskPopover',
	template: '<div class="month-task-popover-stub"></div>',
	props: ['task', 'visible', 'anchorEl'],
	emits: ['close', 'edit', 'delete']
}

describe('MonthCalendar.vue', () => {
	const mountComponent = () => {
		return mount(MonthCalendar, {
			props: {
				year: 2025,
				month: 0,
				tasksByDate: {
					'2025-01-01': [{ id: '1', title: 'Task 1', date: '2025-01-01' } as any]
				}
			},
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: false
					})
				],
				components: {
					MonthDayCell: MonthDayCellStub,
					MonthTaskPopover: MonthTaskPopoverStub
				}
			}
		})
	}

	it('renders header with correct month and year', () => {
		const wrapper = mountComponent()
		expect(wrapper.find('.month-title').text()).toBe('January 2025')
	})

	it('renders navigation buttons', () => {
		const wrapper = mountComponent()
		expect(wrapper.findAll('.nav-btn')).toHaveLength(2)
	})

	it('renders day names header', () => {
		const wrapper = mountComponent()
		const names = wrapper.findAll('.day-name')
		expect(names).toHaveLength(7)
		expect(names[0].text()).toBe('Sun')
	})

	it('renders calendar grid with correct number of days', () => {
		const wrapper = mountComponent()
		// Mock returns 2 weeks = 14 days
		expect(wrapper.findAllComponents(MonthDayCellStub)).toHaveLength(14)
	})

	it('passes correct props to MonthDayCell', () => {
		const wrapper = mountComponent()
		const firstCell = wrapper.findAllComponents(MonthDayCellStub)[0]
		expect(firstCell.props('date')).toBe('2025-01-01')
		expect(firstCell.props('currentMonth')).toBe(0)
		expect(firstCell.props('tasks')).toHaveLength(1)
		expect(firstCell.props('tasks')[0].id).toBe('1')
	})

	it('emits prev-month event', async () => {
		const wrapper = mountComponent()
		await wrapper.findAll('.nav-btn')[0].trigger('click')
		expect(wrapper.emitted('prev-month')).toBeTruthy()
	})

	it('emits next-month event', async () => {
		const wrapper = mountComponent()
		await wrapper.findAll('.nav-btn')[1].trigger('click')
		expect(wrapper.emitted('next-month')).toBeTruthy()
	})

	it('emits create-task when MonthDayCell emits create', async () => {
		const wrapper = mountComponent()
		const cell = wrapper.findAllComponents(MonthDayCellStub)[0]
		cell.vm.$emit('create', '2025-01-01')
		expect(wrapper.emitted('create-task')).toBeTruthy()
		expect(wrapper.emitted('create-task')![0]).toEqual([{ date: '2025-01-01' }])
	})

	it('opens popover when MonthDayCell emits task-click', async () => {
		const wrapper = mountComponent()
		const cell = wrapper.findAllComponents(MonthDayCellStub)[0]
		const task = { id: '1', title: 'Task 1' } as any
		// Create a fake event with currentTarget
		const event = { currentTarget: document.createElement('div') }

		await cell.vm.$emit('task-click', task, event)

		const popover = wrapper.findComponent(MonthTaskPopoverStub)
		expect(popover.props('visible')).toBe(true)
		expect(popover.props('task')).toEqual(task)
		expect(popover.props('anchorEl')).toBe(event.currentTarget)
	})

	it('emits edit-task when MonthDayCell emits task-dblclick', async () => {
		const wrapper = mountComponent()
		const cell = wrapper.findAllComponents(MonthDayCellStub)[0]
		const task = { id: '1', title: 'Task 1' } as any

		cell.vm.$emit('task-dblclick', task)
		expect(wrapper.emitted('edit-task')).toBeTruthy()
		expect(wrapper.emitted('edit-task')![0]).toEqual([task])
	})

	// Drag and Drop
	it('sets drag state on task-dragstart', async () => {
		const wrapper = mountComponent()
		const cell = wrapper.findAllComponents(MonthDayCellStub)[0]
		const task = { id: '1', title: 'Drag Me', date: '2025-01-01' } as any
		const event = { dataTransfer: { setData: vi.fn(), effectAllowed: '' } }

		await cell.vm.$emit('task-dragstart', task, event)

		// We can't access ref state directly if not exposed.
		// But we can verify side effects of drag: drop works?
		// Or assume if internal state is set, drop should trigger store action.

		// Let's rely on handleDrop test to verify flow
		expect(event.dataTransfer.setData).toHaveBeenCalledWith('text/plain', '1')
	})

	it('calls store.moveScheduledTask on drop (different date)', async () => {
		const wrapper = mountComponent()
		const tasksStore = useTasksStore()
		const cell1 = wrapper.findAllComponents(MonthDayCellStub)[0] // 2025-01-01
		const cell2 = wrapper.findAllComponents(MonthDayCellStub)[1] // 2025-01-02

		const task = { id: '1', title: 'Drag Me', date: '2025-01-01' } as any
		const event = { dataTransfer: { setData: vi.fn(), effectAllowed: '' } }

		// Start drag
		await cell1.vm.$emit('task-dragstart', task, event)

		// Drop on different date
		await cell2.vm.$emit('drop', '2025-01-02')

		expect(tasksStore.moveScheduledTask).toHaveBeenCalledWith('1', '2025-01-01', '2025-01-02', { date: '2025-01-02' })
	})

	it('does NOT call store move on drop (same date)', async () => {
		const wrapper = mountComponent()
		const tasksStore = useTasksStore()
		const cell1 = wrapper.findAllComponents(MonthDayCellStub)[0] // 2025-01-01

		const task = { id: '1', title: 'Drag Me', date: '2025-01-01' } as any
		const event = { dataTransfer: { setData: vi.fn(), effectAllowed: '' } }

		// Start drag
		await cell1.vm.$emit('task-dragstart', task, event)

		// Drop on same date
		await cell1.vm.$emit('drop', '2025-01-01')

		expect(tasksStore.moveScheduledTask).not.toHaveBeenCalled()
	})
})
