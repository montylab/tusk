import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import ToDoPile from '../ToDoPile.vue'
import type { Task } from '../../types'

// ── Mocks ──────────────────────────────────────────────────────────
const mockTodoTasks = ref<Task[]>([])

vi.mock('../../stores/categories', () => ({
	useCategoriesStore: () => ({
		categoriesArray: [{ name: 'Work', color: 'red' }]
	})
}))

vi.mock('../../stores/tasks', () => ({
	useTasksStore: () => ({
		todoTasks: mockTodoTasks
	})
}))

vi.mock('pinia', async (importOriginal) => {
	const actual = await importOriginal<typeof import('pinia')>()
	return {
		...actual,
		storeToRefs: (store: Record<string, unknown>) => {
			return store // Already has refs from our mock
		}
	}
})

const TaskItemStub = defineComponent({
	name: 'TaskItem',
	props: ['task', 'isCompact'],
	setup() {
		return () => h('div', { class: 'task-item-stub' })
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
		id: `t-${Math.random()}`,
		text: 'Task',
		category: 'Work',
		completed: false,
		startTime: null,
		duration: 60,
		...overrides
	}
}

function factory(props: Record<string, unknown> = {}, storeTasks: Task[] = []) {
	mockTodoTasks.value = storeTasks

	return mount(ToDoPile, {
		props: {
			isHighlighted: false,
			activeTaskId: undefined,
			...props
		}
	})
}

// ── Tests ──────────────────────────────────────────────────────────
describe('ToDoPile.vue', () => {
	describe('Happy Path', () => {
		it('renders title', () => {
			const wrapper = factory()
			expect(wrapper.find('h3').text()).toBe('To Do 1')
		})

		it('renders tasks from store', () => {
			const tasks = [makeTask({ id: '1' }), makeTask({ id: '2' })]
			const wrapper = factory({}, tasks)
			expect(wrapper.findAll('.pile-task').length).toBe(2)
		})

		it('shows empty state', () => {
			const wrapper = factory({}, [])
			expect(wrapper.find('.empty-state').text()).toBe('No tasks to do')
		})

		it('emits drag-start on task mousedown', async () => {
			const task = makeTask({ id: '1' })
			const wrapper = factory({}, [task])
			const pileTask = wrapper.find('.pile-task')
			await pileTask.trigger('mousedown')

			expect(wrapper.emitted('drag-start')).toBeTruthy()
			expect(wrapper.emitted('drag-start')![0][0]).toMatchObject({
				task: task
			})
		})

		it('highlights when isHighlighted=true', () => {
			const wrapper = factory({ isHighlighted: true })
			expect(wrapper.find('.todo-pile').classes()).toContain('is-highlighted')
		})
	})

	describe('Edge Cases', () => {
		it('chaotic style applied to tasks', () => {
			const task = makeTask({ id: '1' })
			const wrapper = factory({}, [task])
			const style = wrapper.find('.pile-task').attributes('style')
			expect(style).toContain('rotate')
			expect(style).toContain('translateX')
		})
	})
})
