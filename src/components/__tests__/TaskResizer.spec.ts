import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import TaskResizer from '../TaskResizer.vue'
import type { Task } from '../../types'

// ── Mocks ──────────────────────────────────────────────────────────
vi.mock('../../stores/tasks', () => ({
	useTasksStore: () => ({
		updateScheduledTask: vi.fn()
	})
}))

vi.mock('../../stores/settings', () => ({
	useSettingsStore: () => ({
		settings: { snapMinutes: 15 }
	})
}))

vi.mock('../../stores/appearance', () => ({
	useAppearanceStore: () => ({
		hourHeight: 80
	})
}))

vi.mock('pinia', async (importOriginal) => {
	const actual = await importOriginal<typeof import('pinia')>()
	return {
		...actual,
		storeToRefs: (store: Record<string, unknown>) => {
			const refs: Record<string, unknown> = {}
			for (const key of Object.keys(store)) {
				refs[key] = { value: store[key] }
			}
			return refs
		}
	}
})

beforeAll(() => {
	config.global.stubs = {
		Transition: false
	}
})

// ── Helpers ────────────────────────────────────────────────────────
function makeTask(overrides: Partial<Task> = {}): Task {
	return {
		id: 'task-1',
		text: 'Test',
		category: 'Work',
		completed: false,
		startTime: 10,
		duration: 60,
		date: '2026-03-15',
		...overrides
	}
}

function factory(props: Record<string, unknown> = {}) {
	return mount(TaskResizer, {
		props: {
			task: makeTask(),
			layoutStyle: { top: '0px', height: '80px' },
			startHour: 8,
			...props
		},
		slots: {
			default: ({ resizedTask, isResizing }: { resizedTask: Task; isResizing: boolean }) =>
				h('div', { class: 'slot-content', 'data-resizing': isResizing }, resizedTask.text)
		}
	})
}

// ── Tests ──────────────────────────────────────────────────────────
describe('TaskResizer.vue', () => {
	describe('Happy Path', () => {
		it('renders slot content with task data', () => {
			const wrapper = factory()
			expect(wrapper.find('.slot-content').exists()).toBe(true)
			expect(wrapper.find('.slot-content').text()).toBe('Test')
		})

		it('renders top and bottom resize handles', () => {
			const wrapper = factory()
			expect(wrapper.find('.resize-handle.top').exists()).toBe(true)
			expect(wrapper.find('.resize-handle.bottom').exists()).toBe(true)
		})

		it('applies layoutStyle', () => {
			const wrapper = factory({
				layoutStyle: { top: '100px', height: '80px' }
			})
			const style = wrapper.find('.task-resizer-wrapper').attributes('style')
			expect(style).toContain('top: 100px')
		})

		it('emits start-resize on mousedown on bottom handle', async () => {
			const wrapper = factory()
			await wrapper.find('.resize-handle.bottom').trigger('mousedown')
			expect(wrapper.emitted('start-resize')).toBeTruthy()
		})

		it('emits start-resize on mousedown on top handle', async () => {
			const wrapper = factory()
			await wrapper.find('.resize-handle.top').trigger('mousedown')
			expect(wrapper.emitted('start-resize')).toBeTruthy()
		})
	})

	describe('Edge Cases', () => {
		it('uses default 0/60 when task has null startTime/duration', () => {
			const wrapper = factory({
				task: makeTask({ startTime: null, duration: 0 })
			})
			expect(wrapper.find('.slot-content').exists()).toBe(true)
		})
	})
})
