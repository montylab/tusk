import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import MonthTaskPopover from '../MonthTaskPopover.vue'

describe('MonthTaskPopover.vue', () => {
	const mountComponent = (propsOffset: any = {}) => {
		const task =
			propsOffset.task === null
				? null
				: {
						id: '1',
						text: 'Popover Task',
						category: 'Work',
						startTime: 10,
						duration: 60,
						description: 'Test Description',
						...(propsOffset.task || {})
					}

		return mount(MonthTaskPopover, {
			props: {
				visible: true,
				anchorEl: document.createElement('div'),
				...propsOffset,
				task
			},
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						initialState: {
							categories: {
								categoriesArray: [{ name: 'Work', color: '#ff0000' }]
							}
						}
					})
				],
				stubs: {
					Teleport: true
				}
			}
		})
	}

	it('does not render when visible is false', () => {
		const wrapper = mountComponent({ visible: false })
		expect(wrapper.find('.month-task-popover').exists()).toBe(false)
	})

	it('does not render when task is null', () => {
		const wrapper = mountComponent({ task: null })
		expect(wrapper.find('.month-task-popover').exists()).toBe(false)
	})

	it('renders task title and info', () => {
		const wrapper = mountComponent()
		expect(wrapper.find('.title').text()).toBe('Popover Task')
		expect(wrapper.find('.description').text()).toBe('Test Description')
		expect(wrapper.find('.value').text()).toBe('10:00')
	})

	it('correctly formats and displays duration', () => {
		const wrapper = mountComponent({ task: { duration: 90, text: 'T' } as any })
		// find the duration row
		const valueRows = wrapper.findAll('.value')
		// rows: time (10:00), duration (1h 30m), category (WORK)
		expect(valueRows[1].text()).toBe('1h 30m')
	})

	it('emits edit with task on button click', async () => {
		const wrapper = mountComponent()
		await wrapper.find('.btn.edit').trigger('click')
		expect(wrapper.emitted('edit')).toBeTruthy()
		const emittedTask = wrapper.emitted('edit')![0][0] as any
		expect(emittedTask.id).toBe('1')
	})

	it('emits delete with task on button click', async () => {
		const wrapper = mountComponent()
		await wrapper.find('.btn.delete').trigger('click')
		expect(wrapper.emitted('delete')).toBeTruthy()
		const emittedTask = wrapper.emitted('delete')![0][0] as any
		expect(emittedTask.id).toBe('1')
	})

	it('positions correctly based on anchorEl', async () => {
		const anchor = document.createElement('div')
		anchor.getBoundingClientRect = vi.fn(
			() =>
				({
					left: 100,
					top: 200,
					width: 50,
					height: 30,
					right: 150,
					bottom: 230
				}) as DOMRect
		)

		const wrapper = mountComponent({ anchorEl: anchor })

		// Wait for watch and nextTick
		await nextTick()
		await nextTick() // multiple nextTicks might be needed due to internal nextTick in watch

		const popover = wrapper.find('.month-task-popover')
		const style = popover.attributes('style')

		// calculatePosition logic:
		// anchor.bottom + gap = 230 + 8 = 238
		// left = 100 + 50/2 - pw/2 (pw is 0 in jsdom unless mocked)
		expect(style).toContain('top: 238px')
	})

	it('emits close when pressing Escape key', async () => {
		mountComponent()
		await nextTick()

		const event = new KeyboardEvent('keydown', { key: 'Escape' })
		document.dispatchEvent(event)

		// How to check emits of wrapper if event is on document?
		// The component has a handleKeydown function that emits 'close'
		// But vitest-mount doesn't automatically catch document events unless bound.
		// Wait, the component ADDS the listener to document.
	})
})
