import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import DragOperator from '../DragOperator.vue'

// Mock useDragOperator with mutable state
// Mock useDragOperator with mutable state
const { dragOperatorState } = vi.hoisted(() => ({
	dragOperatorState: {
		refs: null as any
	}
}))

vi.mock('../../composables/useDragOperator', async () => {
	const { ref } = await import('vue')
	// Initialize refs
	dragOperatorState.refs = {
		isDragging: ref(false),
		draggedTask: ref(null),
		ghostPosition: ref(null),
		currentZone: ref(null),
		dropData: ref(null),
		isDestroying: ref(false)
	}

	return {
		useDragOperator: () => dragOperatorState.refs
	}
})

// Mock TaskItem
// Mock TaskItem
const { TaskItemStub } = vi.hoisted(() => ({
	TaskItemStub: {
		name: 'TaskItem',
		template: '<div class="task-item-stub"></div>',
		props: ['task', 'isDragging', 'status']
	}
}))

vi.mock('../TaskItem.vue', () => ({ default: TaskItemStub }))

describe('DragOperator.vue', () => {
	const mountComponent = () => {
		return mount(DragOperator, {
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: false,
						initialState: {
							appearance: {
								hourHeight: 60,
								uiScale: 1
							}
						}
					})
				],
				components: {
					TaskItem: TaskItemStub
				},
				stubs: {
					teleport: true
				}
			}
		})
	}

	const resetState = () => {
		if (!dragOperatorState.refs) return
		dragOperatorState.refs.isDragging.value = false
		dragOperatorState.refs.draggedTask.value = null
		dragOperatorState.refs.ghostPosition.value = null
		dragOperatorState.refs.currentZone.value = null
		dragOperatorState.refs.dropData.value = null
		dragOperatorState.refs.isDestroying.value = false
	}

	beforeEach(() => {
		resetState()
	})

	// --- Happy Path ---

	it('hidden by default', () => {
		const wrapper = mountComponent()
		expect(wrapper.find('.drag-ghost').exists()).toBe(false)
	})

	it('visible when isDragging is true', async () => {
		const wrapper = mountComponent()
		dragOperatorState.refs.isDragging.value = true
		dragOperatorState.refs.draggedTask.value = { id: '1', title: 'Test' }
		dragOperatorState.refs.ghostPosition.value = { x: 100, y: 100 }

		await nextTick()

		expect(wrapper.find('.drag-ghost').exists()).toBe(true)
	})

	it('follows mouse position', async () => {
		const wrapper = mountComponent()
		dragOperatorState.refs.isDragging.value = true
		dragOperatorState.refs.draggedTask.value = { id: '1', title: 'Test' }
		dragOperatorState.refs.ghostPosition.value = { x: 200, y: 300 }
		await nextTick()

		const ghost = wrapper.find('.drag-ghost')
		const style = ghost.attributes('style')
		expect(style).toContain('left: 200px')
		expect(style).toContain('top: 300px')
		// transform translate(-50%, -50%) is default
		expect(style).toContain('translate(-50%, -50%)')
	})

	it('snaps to calendar slot when snappedRect is present', async () => {
		const wrapper = mountComponent()
		dragOperatorState.refs.isDragging.value = true
		dragOperatorState.refs.draggedTask.value = { id: '1', title: 'Test' }
		dragOperatorState.refs.currentZone.value = 'calendar-day-2025-01-01'
		dragOperatorState.refs.dropData.value = {
			snappedRect: { left: 50, top: 40, width: 200, height: 60 },
			time: 10,
			duration: 60,
			date: '2025-01-01'
		}
		// ghostPosition is still needed for v-if check in some cases? No, computed depends on it?
		// Line 19: if (!ghostPosition.value) return {}
		// So ghostPosition must be present even when snapped?
		dragOperatorState.refs.ghostPosition.value = { x: 999, y: 999 }

		await nextTick()

		const ghost = wrapper.find('.drag-ghost')
		const style = ghost.attributes('style')
		expect(style).toContain('left: 50px')
		expect(style).toContain('top: 40px')
		expect(style).toContain('width: 200px')
		expect(style).toContain('height: 60px')
		expect(style).toContain('transform: none') // Snapped disables transform centering
	})

	it('renders TaskItem with ghost task', async () => {
		const wrapper = mountComponent()
		dragOperatorState.refs.isDragging.value = true
		dragOperatorState.refs.draggedTask.value = { id: '1', title: 'Original Title', duration: 30 }
		dragOperatorState.refs.ghostPosition.value = { x: 0, y: 0 }
		await nextTick()

		const taskItem = wrapper.findComponent(TaskItemStub)
		expect(taskItem.exists()).toBe(true)
		expect(taskItem.props('task').title).toBe('Original Title')
		// Default overrides duration to 60 if not over calendar
		expect(taskItem.props('task').duration).toBe(60)
	})

	it('applies overrides from dropData', async () => {
		const wrapper = mountComponent()
		dragOperatorState.refs.isDragging.value = true
		dragOperatorState.refs.draggedTask.value = { id: '1', title: 'Original', duration: 30 }
		dragOperatorState.refs.currentZone.value = 'calendar-day-2025-01-01'
		dragOperatorState.refs.dropData.value = {
			time: 10,
			duration: 90,
			date: '2025-01-01'
		}
		dragOperatorState.refs.ghostPosition.value = { x: 0, y: 0 }
		await nextTick()

		const taskItem = wrapper.findComponent(TaskItemStub)
		expect(taskItem.props('task').duration).toBe(90)
		expect(taskItem.props('task').startTime).toBe(10)
		expect(taskItem.props('task').date).toBe('2025-01-01')
	})

	// --- Edge Cases ---

	it('isDestroying triggers animation', async () => {
		const wrapper = mountComponent()
		dragOperatorState.refs.isDestroying.value = true
		dragOperatorState.refs.draggedTask.value = { id: '1', title: 'Destroy Me' }
		dragOperatorState.refs.ghostPosition.value = { x: 100, y: 100 } // ghostPosition needed?

		await nextTick()

		// isVisible is true if isDestroying is true
		expect(wrapper.find('.drag-ghost').exists()).toBe(true)
		const ghost = wrapper.find('.drag-ghost')
		expect(ghost.classes()).toContain('is-destroying')

		const style = ghost.attributes('style')
		expect(style).toContain('scale(0)')
		expect(style).toContain('rotate(20deg)')
		expect(style).toContain('opacity: 0')
	})
})
