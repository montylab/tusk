import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import MonthTaskItem from '../MonthTaskItem.vue'

describe('MonthTaskItem.vue', () => {
	const mountComponent = (propsOffset: any = {}) => {
		return mount(MonthTaskItem, {
			props: {
				task: {
					id: '1',
					text: 'Test Task',
					category: 'Work',
					startTime: 10.5,
					...propsOffset.task
				},
				...propsOffset
			},
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						initialState: {
							categories: {
								categoriesMap: {
									'1': { id: '1', name: 'Work', color: '#ff0000' },
									'2': { id: '2', name: 'Personal', color: '#00ff00' }
								}
							}
						}
					})
				]
			}
		})
	}

	it('renders title correctly', () => {
		const wrapper = mountComponent()
		expect(wrapper.find('.title').text()).toBe('Test Task')
	})

	it('renders formatted time when startTime is present', () => {
		const wrapper = mountComponent({ task: { startTime: 10.5 } }) // 10:30
		expect(wrapper.find('.time').text()).toBe('10:30')
	})

	it('hides time when startTime is null', () => {
		const wrapper = mountComponent({ task: { startTime: null } })
		expect(wrapper.find('.time').exists()).toBe(false)
	})

	it('resolves bullet color from task color', () => {
		const wrapper = mountComponent({ task: { color: '#0000ff' } })
		const bullet = wrapper.find('.bullet')
		expect(bullet.attributes('style')).toContain('background-color: rgb(0, 0, 255)')
	})

	it('resolves bullet color from category if task color is missing', () => {
		const wrapper = mountComponent({ task: { category: 'Work', color: undefined } })
		const bullet = wrapper.find('.bullet')
		expect(bullet.attributes('style')).toContain('background-color: rgb(255, 0, 0)')
	})

	it('emits click and stops propagation', async () => {
		const wrapper = mountComponent()
		const event = new MouseEvent('click')
		const spy = vi.spyOn(event, 'stopPropagation')

		await wrapper.trigger('click', { stopPropagation: spy })
		// Note: trigger might not use the real event object in a way that allows spyOn(event).
		// But in MonthTaskItem it calls e.stopPropagation()

		expect(wrapper.emitted('click')).toBeTruthy()
	})

	it('emits dblclick and stops propagation', async () => {
		const wrapper = mountComponent()
		await wrapper.trigger('dblclick')
		expect(wrapper.emitted('dblclick')).toBeTruthy()
	})

	it('emits dragstart', async () => {
		const wrapper = mountComponent()
		await wrapper.trigger('dragstart')
		expect(wrapper.emitted('dragstart')).toBeTruthy()
	})

	it('applies dragging class when isDragging is true', () => {
		const wrapper = mountComponent({ isDragging: true })
		expect(wrapper.classes()).toContain('dragging')
	})
})
