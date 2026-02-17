// Polyfill ResizeObserver for jsdom
globalThis.ResizeObserver = class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
} as unknown as typeof ResizeObserver

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import TaskPile from '../TaskPile.vue'
import type { Task } from '../../types'

// ── Mocks ──────────────────────────────────────────────────────────
vi.mock('../../stores/categories', () => ({
	useCategoriesStore: () => ({
		categoriesArray: []
	})
}))

vi.mock('../../stores/tasks', () => ({
	useTasksStore: () => ({
		calculateNewOrder: vi.fn(() => 0)
	})
}))

vi.mock('../../composables/useDragOperator', () => ({
	useDragOperator: () => ({
		currentZone: ref(null),
		activeDraggedTaskId: ref(null),
		isDragging: ref(false),
		registerZone: vi.fn(),
		unregisterZone: vi.fn(),
		updateZoneBounds: vi.fn(),
		startDrag: vi.fn()
	})
}))

const TaskItemStub = defineComponent({
	name: 'TaskItem',
	props: ['task', 'isCompact', 'badgeText'],
	emits: ['edit'],
	setup(props) {
		return () =>
			h('div', {
				class: 'task-item-stub',
				'data-badge': props.badgeText
			})
	}
})

beforeAll(() => {
	config.global.stubs = {
		TaskItem: TaskItemStub,
		TransitionGroup: false
	}
})

// ── Helpers ────────────────────────────────────────────────────────
function makeTask(overrides: Partial<Task> = {}): Task {
	return {
		id: `task-${Math.random()}`,
		text: 'Test Task',
		category: 'Work',
		completed: false,
		startTime: 10,
		duration: 60,
		...overrides
	}
}

function factory(props: Record<string, unknown> = {}) {
	return mount(TaskPile, {
		props: {
			title: 'Test Pile',
			tasks: [],
			listType: 'todo' as const,
			...props
		}
	})
}

// ── Tests ──────────────────────────────────────────────────────────
describe('TaskPile.vue', () => {
	describe('Happy Path', () => {
		it('renders pile title', () => {
			const wrapper = factory({ title: 'Shortcuts' })
			expect(wrapper.find('.pile-title').text()).toBe('Shortcuts')
		})

		it('renders TaskItem for each task', () => {
			const tasks = [makeTask({ id: 't1' }), makeTask({ id: 't2' })]
			const wrapper = factory({ tasks })
			const items = wrapper.findAllComponents(TaskItemStub)
			expect(items.length).toBe(2)
		})

		it('shows badge text for first 9 shortcuts', () => {
			const tasks = Array.from({ length: 10 }, (_, i) => makeTask({ id: `t${i}` }))
			const wrapper = factory({ tasks, listType: 'shortcut' })
			const items = wrapper.findAllComponents(TaskItemStub)
			expect(items[0].props('badgeText')).toBe('Ctrl + 1')
			expect(items[8].props('badgeText')).toBe('Ctrl + 9')
			expect(items[9].props('badgeText')).toBeUndefined()
		})

		it("emits 'edit' when TaskItem emits edit", async () => {
			const task = makeTask({ id: 't1' })
			const wrapper = factory({ tasks: [task] })
			const item = wrapper.findComponent(TaskItemStub)
			await item.vm.$emit('edit', task)
			expect(wrapper.emitted('edit')).toBeTruthy()
			expect(wrapper.emitted('edit')![0][0]).toEqual(task)
		})

		it('applies is-shortcuts class for shortcut type', () => {
			const wrapper = factory({ listType: 'shortcut' })
			expect(wrapper.find('.task-pile').classes()).toContain('is-shortcuts')
		})

		it('applies shortcut-pile class for shortcut type', () => {
			const wrapper = factory({ listType: 'shortcut' })
			expect(wrapper.find('.task-pile').classes()).toContain('shortcut-pile')
		})

		it('applies todo-pile class for todo type', () => {
			const wrapper = factory({ listType: 'todo' })
			expect(wrapper.find('.task-pile').classes()).toContain('todo-pile')
		})
	})

	describe('Edge Cases', () => {
		it('shows empty state for todo when tasks empty', () => {
			const wrapper = factory({ tasks: [], listType: 'todo' })
			expect(wrapper.find('.empty-state').text()).toBe('No tasks to do')
		})

		it('shows empty state for shortcuts when tasks empty', () => {
			const wrapper = factory({ tasks: [], listType: 'shortcut' })
			expect(wrapper.find('.empty-state').text()).toBe('No shortcuts yet')
		})

		it('passes isCompact to all TaskItems', () => {
			const tasks = [makeTask({ id: 't1' })]
			const wrapper = factory({ tasks })
			const item = wrapper.findComponent(TaskItemStub)
			// Boolean shorthand `is-compact` in template renders as '' (truthy)
			expect(item.props('isCompact')).toBeDefined()
		})
	})
})
