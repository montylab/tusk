import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import ShortcutsPile from '../ShortcutsPile.vue'
import { useTasksStore } from '../../stores/tasks'

// Mock TaskItem
const TaskItemStub = {
	name: 'TaskItem',
	template: '<div class="task-item-stub"></div>',
	props: ['task', 'isCompact']
}

describe('ShortcutsPile.vue', () => {
	const mountComponent = (propsOffset: any = {}) => {
		return mount(ShortcutsPile, {
			props: {
				isHighlighted: false,
				...propsOffset
			},
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						initialState: {
							categories: {
								categoriesMap: {
									'1': { id: '1', name: 'Work', color: '#ff0000' }
								}
							}
						}
					})
				],
				components: {
					TaskItem: TaskItemStub
				},
				stubs: {
					TransitionGroup: false // Don't stub to ensure children are correctly handled by querySelector
				}
			}
		})
	}

	it('renders shortcut tasks', async () => {
		const wrapper = mountComponent()
		const tasksStore = useTasksStore()
		tasksStore.$patch({
			shortcutsTasksState: [
				{ id: '1', text: 'Task 1', category: 'Work', order: 10 },
				{ id: '2', text: 'Task 2', category: 'Personal', order: 20 }
			]
		})
		await nextTick()

		expect(wrapper.findAll('.pile-task')).toHaveLength(2)
	})

	it('shows empty state when no shortcuts', async () => {
		const wrapper = mountComponent()
		const tasksStore = useTasksStore()
		tasksStore.$patch({ shortcutsTasksState: [] })
		await nextTick()
		expect(wrapper.find('.empty-state').exists()).toBe(true)
	})

	it('emits update:bounds on mount', async () => {
		const rect = { left: 10, top: 20, width: 100, height: 200 } as DOMRect
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect)

		const wrapper = mountComponent()
		await nextTick()

		expect(wrapper.emitted('update:bounds')).toBeTruthy()
		expect(wrapper.emitted('update:bounds')![0]).toEqual([rect])
	})

	it('calculates insertionIndex on mousemove', async () => {
		const wrapper = mountComponent({ isHighlighted: true })
		const tasksStore = useTasksStore()
		tasksStore.$patch({
			shortcutsTasksState: [
				{ id: '1', text: 'T1', category: 'Work', order: 10 },
				{ id: '2', text: 'T2', category: 'Personal', order: 20 }
			]
		})
		await nextTick()

		const taskEls = wrapper.findAll('.pile-task')
		expect(taskEls).toHaveLength(2)

		// Mock bounding rects on prototype to handle potential re-renders
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
			if (this.classList.contains('pile-task')) {
				const index = Array.from(this.parentElement?.querySelectorAll('.pile-task') || []).indexOf(this)
				if (index === 0) return { top: 100, height: 50, bottom: 150 } as DOMRect
				if (index === 1) return { top: 150, height: 50, bottom: 200 } as DOMRect
			}
			return { top: 0, left: 0, width: 0, height: 0 } as DOMRect
		})

		// Move mouse above first task
		window.dispatchEvent(new MouseEvent('mousemove', { clientY: 110 }))
		await nextTick()
		expect(wrapper.emitted('update:insertion-index')).toContainEqual([0])

		// Move mouse between tasks
		window.dispatchEvent(new MouseEvent('mousemove', { clientY: 140 }))
		await nextTick()
		expect(wrapper.emitted('update:insertion-index')).toContainEqual([1])

		// Move mouse below last task
		window.dispatchEvent(new MouseEvent('mousemove', { clientY: 220 }))
		await nextTick()
		expect(wrapper.emitted('update:insertion-index')).toContainEqual([2])
	})

	it('emits drag-start on mousedown', async () => {
		const wrapper = mountComponent()
		const tasksStore = useTasksStore()
		tasksStore.$patch({
			shortcutsTasksState: [{ id: '1', text: 'T1', category: 'Work', order: 10 }]
		})
		await nextTick()

		await wrapper.find('.pile-task').trigger('mousedown')
		expect(wrapper.emitted('drag-start')).toBeTruthy()
	})
})
