import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import TaskItem from '../TaskItem.vue'
import PrimeVue from 'primevue/config'
import type { Task } from '../../types'

// ── Mocks ──────────────────────────────────────────────────────────
vi.mock('../../stores/categories', () => ({
	useCategoriesStore: () => ({
		categoriesArray: [
			{ id: 'cat-1', name: 'Work', color: '#00ff00', order: 0 },
			{ id: 'cat-2', name: 'Personal', color: '#0000ff', order: 1 }
		]
	})
}))

vi.mock('../../utils/dateUtils', () => ({
	formatTime: (time: number) => {
		const h = Math.floor(time)
		const m = Math.round((time % 1) * 60)
		return `${h}:${m.toString().padStart(2, '0')}`
	},
	formatDuration: (minutes: number) => {
		if (minutes < 60) return `${minutes}m`
		const h = Math.floor(minutes / 60)
		const m = Math.round(minutes % 60)
		return m > 0 ? `${h}h ${m}m` : `${h}h`
	}
}))

const AppIconStub = defineComponent({
	name: 'AppIcon',
	props: ['name', 'size'],
	setup() {
		return () => h('i', { class: 'app-icon-stub' })
	}
})

beforeAll(() => {
	config.global.plugins = [PrimeVue]
	config.global.stubs = { AppIcon: AppIconStub }
})

// ── Helpers ────────────────────────────────────────────────────────
function makeTask(overrides: Partial<Task> = {}): Task {
	return {
		id: 'task-1',
		text: 'My Task',
		category: 'Work',
		completed: false,
		startTime: 10,
		duration: 90,
		date: '2026-03-15',
		color: '#ff0000',
		description: 'Task details',
		isDeepWork: false,
		...overrides
	}
}

function factory(props: Record<string, unknown> = {}) {
	return mount(TaskItem, {
		props: { task: makeTask(), ...props }
	})
}

// ── Tests ──────────────────────────────────────────────────────────
describe('TaskItem.vue', () => {
	// ── Happy Path ─────────────────────────────────────────────────
	describe('Happy Path', () => {
		it('renders task title', () => {
			const wrapper = factory({ task: makeTask({ text: 'Do Stuff' }) })
			expect(wrapper.find('.title').text()).toBe('Do Stuff')
		})

		it('renders time badge with start and end time', () => {
			const wrapper = factory({ task: makeTask({ startTime: 10, duration: 90 }) })
			const timeBadge = wrapper.find('.time-badge')
			expect(timeBadge.exists()).toBe(true)
			expect(timeBadge.text()).toContain('10:00')
			expect(timeBadge.text()).toContain('11:30')
		})

		it('renders duration badge', () => {
			const wrapper = factory({ task: makeTask({ duration: 90 }) })
			expect(wrapper.find('.duration-badge').text()).toBe('1h 30m')
		})

		it('renders category badge', () => {
			const wrapper = factory({ task: makeTask({ category: 'Work' }) })
			expect(wrapper.find('.category-badge').text()).toBe('Work')
		})

		it('renders deep work badge when isDeepWork=true', () => {
			const wrapper = factory({ task: makeTask({ isDeepWork: true }) })
			expect(wrapper.find('.deep-work-badge').exists()).toBe(true)
		})

		it("emits 'edit' on dblclick", async () => {
			const task = makeTask()
			const wrapper = factory({ task })
			await wrapper.find('.task-item').trigger('dblclick')
			expect(wrapper.emitted('edit')).toBeTruthy()
			expect(wrapper.emitted('edit')![0][0]).toEqual(task)
		})

		it("emits 'edit' on edit button click", async () => {
			const task = makeTask()
			const wrapper = factory({ task })
			await wrapper.find('.edit-btn').trigger('click')
			expect(wrapper.emitted('edit')).toBeTruthy()
			expect(wrapper.emitted('edit')![0][0]).toEqual(task)
		})

		it("shows ON AIR tag when status='on-air'", () => {
			const wrapper = factory({ status: 'on-air' })
			expect(wrapper.find('.on-air-tag').exists()).toBe(true)
			expect(wrapper.find('.on-air-tag').text()).toBe('ON AIR')
		})

		it('applies category color via itemStyle', () => {
			const wrapper = factory({ task: makeTask({ color: '#ff0000' }) })
			const style = wrapper.find('.task-item').attributes('style')
			expect(style).toContain('--category-color: #ff0000')
		})

		it('shows description when not compact', () => {
			const wrapper = factory({ task: makeTask({ description: 'Details', duration: 60 }) })
			expect(wrapper.find('.description-text').exists()).toBe(true)
			expect(wrapper.find('.description-text').text()).toBe('Details')
		})
	})

	// ── Edge Cases ─────────────────────────────────────────────────
	describe('Edge Cases', () => {
		it('hides time badge when startTime is null', () => {
			const wrapper = factory({ task: makeTask({ startTime: null }) })
			expect(wrapper.find('.time-badge').exists()).toBe(false)
		})

		it("shows 'Uncategorized' when category is empty", () => {
			const wrapper = factory({ task: makeTask({ category: '' }) })
			expect(wrapper.find('.category-badge').text()).toBe('Uncategorized')
		})

		it('hides deep work badge when isDeepWork=false', () => {
			const wrapper = factory({ task: makeTask({ isDeepWork: false }) })
			expect(wrapper.find('.deep-work-badge').exists()).toBe(false)
		})

		it('falls back to category store color when task.color is null', () => {
			const wrapper = factory({ task: makeTask({ color: null, category: 'Work' }) })
			const style = wrapper.find('.task-item').attributes('style')
			expect(style).toContain('--category-color: #00ff00') // from store mock
		})

		it('falls back to default color when no task or category color', () => {
			const wrapper = factory({ task: makeTask({ color: null, category: 'Unknown' }) })
			const style = wrapper.find('.task-item').attributes('style')
			expect(style).toContain('--category-color: var(--color-default)')
		})

		it('isAutoCompact is true when duration <= 30', () => {
			const wrapper = factory({ task: makeTask({ duration: 30 }) })
			expect(wrapper.find('.task-item').classes()).toContain('is-auto-compact')
		})

		it('description hidden when isCompact=true', () => {
			const wrapper = factory({
				task: makeTask({ description: 'text', duration: 60 }),
				isCompact: true
			})
			expect(wrapper.find('.description-text').exists()).toBe(false)
		})

		it('description hidden when isAutoCompact (duration<=30)', () => {
			const wrapper = factory({ task: makeTask({ description: 'text', duration: 15 }) })
			expect(wrapper.find('.description-text').exists()).toBe(false)
		})
	})

	// ── UI/Interaction ─────────────────────────────────────────────
	describe('UI/Interaction', () => {
		it("applies 'dragging' class", () => {
			const wrapper = factory({ isDragging: true })
			expect(wrapper.find('.task-item').classes()).toContain('dragging')
		})

		it("applies 'shaking' class", () => {
			const wrapper = factory({ isShaking: true })
			expect(wrapper.find('.task-item').classes()).toContain('shaking')
		})

		it('applies status classes (in-past)', () => {
			const wrapper = factory({ status: 'past' })
			expect(wrapper.find('.task-item').classes()).toContain('in-past')
		})

		it('applies status classes (in-future)', () => {
			const wrapper = factory({ status: 'future' })
			expect(wrapper.find('.task-item').classes()).toContain('in-future')
		})

		it('applies time-size class based on duration', () => {
			const wrapper = factory({ task: makeTask({ duration: 60 }) })
			expect(wrapper.find('.task-item').classes()).toContain('time-size-60')
		})

		it('renders shortcut badge when badgeText provided', () => {
			const wrapper = factory({ badgeText: '⌘1' })
			expect(wrapper.find('.shortcut-badge').exists()).toBe(true)
			expect(wrapper.find('.shortcut-badge').text()).toBe('⌘1')
		})

		it('hides shortcut badge when badgeText not provided', () => {
			const wrapper = factory()
			expect(wrapper.find('.shortcut-badge').exists()).toBe(false)
		})
	})
})
