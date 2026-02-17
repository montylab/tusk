import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MonthDayCell from '../MonthDayCell.vue'

// Mock dateUtils
vi.mock('../../utils/dateUtils', () => ({
	isToday: vi.fn((date) => date === '2025-01-01'), // Mock 2025-01-01 as today
	getMonthFromDate: vi.fn((date) => new Date(date).getMonth())
}))

// Mock Subcomponents
const { MonthTaskItemStub } = vi.hoisted(() => ({
	MonthTaskItemStub: {
		name: 'MonthTaskItem',
		template: '<div class="month-task-item-stub"></div>',
		props: ['task'],
		emits: ['click', 'dblclick', 'dragstart']
	}
}))

vi.mock('../MonthTaskItem.vue', () => ({ default: MonthTaskItemStub }))

describe('MonthDayCell.vue', () => {
	const mountComponent = (propsOffset = {}) => {
		return mount(MonthDayCell, {
			props: {
				date: '2025-01-02',
				tasks: [],
				currentMonth: 0, // Jan
				...propsOffset
			},
			global: {
				components: {
					MonthTaskItem: MonthTaskItemStub
				}
			}
		})
	}

	it('renders day number correctly from date', () => {
		const wrapper = mountComponent({ date: '2025-01-15' })
		expect(wrapper.find('.day-number').text()).toBe('15')
	})

	it('renders tasks list sorted by startTime', () => {
		const tasks = [
			{ id: '1', title: 'Task 1', startTime: 10, duration: 60 } as any,
			{ id: '2', title: 'Task 2', startTime: 9, duration: 30 } as any,
			{ id: '3', title: 'Task 3', startTime: 11, duration: 45 } as any
		]
		const wrapper = mountComponent({ tasks })
		const items = wrapper.findAllComponents(MonthTaskItemStub)
		expect(items).toHaveLength(3)
		// Expect sorted order: 9, 10, 11
		expect(items[0].props('task').id).toBe('2')
		expect(items[1].props('task').id).toBe('1')
		expect(items[2].props('task').id).toBe('3')
	})

	it('applies other-month class when date month != currentMonth', () => {
		const wrapper = mountComponent({ date: '2025-02-01', currentMonth: 0 }) // Feb vs Jan
		expect(wrapper.classes()).toContain('other-month')
	})

	it('applies is-today class when date is today', () => {
		// Mock says 2025-01-01 is today
		const wrapper = mountComponent({ date: '2025-01-01' })
		expect(wrapper.classes()).toContain('is-today')
	})

	it('emits create when clicking on cell background (cell-content)', async () => {
		const wrapper = mountComponent()
		await wrapper.find('.cell-content').trigger('click')
		expect(wrapper.emitted('create')).toBeTruthy()
		expect(wrapper.emitted('create')![0]).toEqual(['2025-01-02'])
	})

	it('emits create when clicking on day header', async () => {
		const wrapper = mountComponent()
		await wrapper.find('.day-header').trigger('click')
		expect(wrapper.emitted('create')).toBeTruthy()
	})

	it('emits task-click when MonthTaskItem emits click', async () => {
		const wrapper = mountComponent({
			tasks: [{ id: '1', title: 'Task 1' } as any]
		})
		const item = wrapper.findComponent(MonthTaskItemStub)
		const task = { id: '1' } // Assuming mock task
		const event = { type: 'click' }

		item.vm.$emit('click', task, event)
		expect(wrapper.emitted('task-click')).toBeTruthy()
		expect(wrapper.emitted('task-click')![0]).toEqual([task, event])
	})

	it('emits task-dblclick when MonthTaskItem emits dblclick', async () => {
		const wrapper = mountComponent({
			tasks: [{ id: '1', title: 'Task 1' } as any]
		})
		const item = wrapper.findComponent(MonthTaskItemStub)
		const task = { id: '1' }

		item.vm.$emit('dblclick', task)
		expect(wrapper.emitted('task-dblclick')).toBeTruthy()
		expect(wrapper.emitted('task-dblclick')![0]).toEqual([task])
	})

	// Drag and Drop
	it('emits task-dragstart when MonthTaskItem emits dragstart', async () => {
		const wrapper = mountComponent({
			tasks: [{ id: '1', title: 'Task 1' } as any]
		})
		const item = wrapper.findComponent(MonthTaskItemStub)
		const task = { id: '1' }
		const event = { type: 'dragstart' }

		item.vm.$emit('dragstart', task, event)
		expect(wrapper.emitted('task-dragstart')).toBeTruthy()
		expect(wrapper.emitted('task-dragstart')![0]).toEqual([task, event])
	})

	it('sets drag-over class and emits dragover on dragover event', async () => {
		const wrapper = mountComponent()
		await wrapper.trigger('dragover')

		expect(wrapper.classes()).toContain('drag-over')
		expect(wrapper.emitted('dragover')).toBeTruthy()
	})

	it('removes drag-over class on dragleave', async () => {
		const wrapper = mountComponent()
		await wrapper.trigger('dragover')
		expect(wrapper.classes()).toContain('drag-over')

		await wrapper.trigger('dragleave')
		expect(wrapper.classes()).not.toContain('drag-over')
	})

	it('removes drag-over class and emits drop on drop event', async () => {
		const wrapper = mountComponent()
		await wrapper.trigger('dragover')
		expect(wrapper.classes()).toContain('drag-over')

		await wrapper.trigger('drop')
		expect(wrapper.classes()).not.toContain('drag-over')
		expect(wrapper.emitted('drop')).toBeTruthy()
		expect(wrapper.emitted('drop')![0][0]).toBe('2025-01-02') // Emits date
	})
})
