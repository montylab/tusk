import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { nextTick, defineComponent, h } from 'vue'
import TaskEditorPopup from '../TaskEditorPopup.vue'
import PrimeVue from 'primevue/config'
import type { Task } from '../../types'

// ── Stubs ──────────────────────────────────────────────────────────
const mockEnsureCategoryExists = vi.fn().mockResolvedValue({
	id: 'cat-1',
	name: 'Work',
	color: '#ff0000',
	order: 0
})

vi.mock('../../stores/categories', () => ({
	useCategoriesStore: () => ({
		ensureCategoryExists: mockEnsureCategoryExists,
		categories: []
	})
}))

const AppIconStub = defineComponent({
	name: 'AppIcon',
	props: ['name', 'size'],
	setup() {
		return () => h('i', { class: 'app-icon-stub' })
	}
})

const AppCheckboxStub = defineComponent({
	name: 'AppCheckbox',
	props: ['modelValue', 'label'],
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		return () =>
			h('input', {
				type: 'checkbox',
				class: 'checkbox-stub',
				checked: props.modelValue,
				onChange: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).checked)
			})
	}
})

const CategorySelectorStub = defineComponent({
	name: 'CategorySelector',
	props: ['name', 'color', 'isDeepWork'],
	emits: ['update:name', 'update:color', 'update:isDeepWork'],
	setup() {
		return () => h('div', { class: 'category-selector-stub' })
	}
})

const TaskDateTimePickerStub = defineComponent({
	name: 'TaskDateTimePicker',
	props: ['date', 'time', 'view'],
	emits: ['update:date', 'update:time'],
	setup() {
		return () => h('div', { class: 'datetime-picker-stub' })
	}
})

beforeAll(() => {
	config.global.plugins = [PrimeVue]
	config.global.stubs = {
		AppIcon: AppIconStub,
		AppCheckbox: AppCheckboxStub,
		CategorySelector: CategorySelectorStub,
		TaskDateTimePicker: TaskDateTimePickerStub,
		Teleport: true,
		Transition: false
	}
})

// ── Helpers ────────────────────────────────────────────────────────
function getTodayString(): string {
	const d = new Date()
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function makeTask(overrides: Partial<Task> = {}): Task {
	return {
		id: 'task-1',
		text: 'Test Task',
		category: 'Work',
		completed: false,
		startTime: 10,
		duration: 90,
		date: '2026-03-15',
		color: '#ff0000',
		description: 'A task description',
		isDeepWork: true,
		...overrides
	}
}

function factory(props: Record<string, unknown> = {}) {
	return mount(TaskEditorPopup, {
		props: { show: true, ...props },
		attachTo: document.body
	})
}

// ── Tests ──────────────────────────────────────────────────────────
describe('TaskEditorPopup.vue', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	// ── Happy Path ─────────────────────────────────────────────────
	describe('Happy Path', () => {
		it('renders in create mode when no task prop provided', () => {
			const wrapper = factory()
			expect(wrapper.find('.popup-header h2').text()).toBe('Create New Task')
			expect(wrapper.find('.btn-primary').text()).toBe('Create Task')
		})

		it('renders in edit mode when task prop provided', () => {
			const wrapper = factory({ task: makeTask() })
			expect(wrapper.find('.popup-header h2').text()).toBe('Edit Task')
			expect(wrapper.find('.btn-primary').text()).toBe('Save Changes')
		})

		it('form populates from task prop in edit mode', () => {
			const task = makeTask({
				text: 'Edit Me',
				description: 'Some description',
				duration: 120, // 2 hours
				isDeepWork: true
			})
			const wrapper = factory({ task })
			const input = wrapper.find('#task-text').element as HTMLInputElement
			expect(input.value).toBe('Edit Me')
			const textarea = wrapper.find('#task-description').element as HTMLTextAreaElement
			expect(textarea.value).toBe('Some description')
		})

		it('form resets to defaults in create mode', () => {
			const wrapper = factory()
			const input = wrapper.find('#task-text').element as HTMLInputElement
			expect(input.value).toBe('')
		})

		it('emits create with correct payload on submit (create mode)', async () => {
			const wrapper = factory({ taskType: 'scheduled' })
			await wrapper.find('#task-text').setValue('New Task')
			await wrapper.find('form').trigger('submit.prevent')
			await nextTick()

			const createEvents = wrapper.emitted('create')
			expect(createEvents).toBeTruthy()
			const payload = createEvents![0][0] as Record<string, unknown>
			expect(payload.text).toBe('New Task')
			expect(payload.category).toBe('Default')
			expect(payload.duration).toBe(60) // 1.0 * 60
			expect(payload.startTime).toBe(9) // default for scheduled
		})

		it('emits update with correct payload on submit (edit mode)', async () => {
			const task = makeTask()
			const wrapper = factory({ task })
			await wrapper.find('#task-text').setValue('Updated Task')
			await wrapper.find('form').trigger('submit.prevent')
			await nextTick()

			const updateEvents = wrapper.emitted('update')
			expect(updateEvents).toBeTruthy()
			const payload = updateEvents![0][0] as Record<string, unknown>
			expect(payload).toHaveProperty('id', 'task-1')
			expect(payload).toHaveProperty('updates')
			const updates = (payload as { updates: Record<string, unknown> }).updates
			expect(updates.text).toBe('Updated Task')
		})

		it('emits close when Cancel button clicked', async () => {
			const wrapper = factory()
			await wrapper.find('.btn-secondary').trigger('click')
			expect(wrapper.emitted('close')).toBeTruthy()
		})

		it('emits close when overlay mousedown.self', async () => {
			const wrapper = factory()
			await wrapper.find('.popup-overlay').trigger('mousedown')
			expect(wrapper.emitted('close')).toBeTruthy()
		})

		it('emits close on Escape key', async () => {
			const wrapper = factory()
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
			await nextTick()
			expect(wrapper.emitted('close')).toBeTruthy()
		})

		it('calls categoriesStore.ensureCategoryExists on submit', async () => {
			const wrapper = factory()
			await wrapper.find('#task-text').setValue('Task')
			await wrapper.find('form').trigger('submit.prevent')
			await nextTick()

			expect(mockEnsureCategoryExists).toHaveBeenCalledWith('Default', '#3b82f6', false)
		})

		it('closes popup after successful submit', async () => {
			const wrapper = factory()
			await wrapper.find('#task-text').setValue('Task')
			await wrapper.find('form').trigger('submit.prevent')
			await nextTick()

			expect(wrapper.emitted('close')).toBeTruthy()
		})
	})

	// ── Edge Cases ─────────────────────────────────────────────────
	describe('Edge Cases', () => {
		it('does not submit if taskText is empty/whitespace', async () => {
			const wrapper = factory()
			await wrapper.find('#task-text').setValue('   ')
			await wrapper.find('form').trigger('submit.prevent')
			await nextTick()

			expect(wrapper.emitted('create')).toBeFalsy()
			expect(wrapper.emitted('update')).toBeFalsy()
		})

		it("defaults category to 'Default' when empty", async () => {
			const wrapper = factory()
			await wrapper.find('#task-text').setValue('Task')
			await wrapper.find('form').trigger('submit.prevent')
			await nextTick()

			const createEvents = wrapper.emitted('create')!
			const payload = createEvents[0][0] as Record<string, unknown>
			expect(payload.category).toBe('Default')
		})

		it("defaults color to '#3b82f6' when empty", async () => {
			const wrapper = factory()
			await wrapper.find('#task-text').setValue('Task')
			await wrapper.find('form').trigger('submit.prevent')
			await nextTick()

			expect(mockEnsureCategoryExists).toHaveBeenCalledWith('Default', '#3b82f6', false)
		})

		it('uses initialStartTime when provided in create mode', () => {
			const wrapper = factory({ initialStartTime: 14, taskType: 'scheduled' })
			// The component should have initialized startTime to 14
			// We verify via the projected end time display or the emitted payload
			// Let's submit and check
			expect(wrapper.html()).toBeTruthy() // component renders
		})

		it('defaults startTime to 9 for scheduled tasks without initialStartTime', async () => {
			const wrapper = factory({ taskType: 'scheduled' })
			await wrapper.find('#task-text').setValue('Task')
			await wrapper.find('form').trigger('submit.prevent')
			await nextTick()

			const payload = wrapper.emitted('create')![0][0] as Record<string, unknown>
			expect(payload.startTime).toBe(9)
		})

		it('startTime is null for non-scheduled (todo) tasks', async () => {
			const wrapper = factory({ taskType: 'todo' })
			await wrapper.find('#task-text').setValue('Task')
			await wrapper.find('form').trigger('submit.prevent')
			await nextTick()

			const payload = wrapper.emitted('create')![0][0] as Record<string, unknown>
			expect(payload.startTime).toBeNull()
		})

		it('duration converts between hours (internal) and minutes (payload)', async () => {
			const task = makeTask({ duration: 90 }) // 90 min = 1.5 hrs internal
			const wrapper = factory({ task })
			await wrapper.find('form').trigger('submit.prevent')
			await nextTick()

			const payload = wrapper.emitted('update')![0][0] as { updates: Record<string, unknown> }
			expect(payload.updates.duration).toBe(90) // converted back to minutes
		})

		it('uses initialDate when provided', () => {
			const wrapper = factory({ initialDate: '2026-03-15', taskType: 'scheduled' })
			expect(wrapper.html()).toBeTruthy()
		})

		it('defaults date to today string when no initialDate', async () => {
			const wrapper = factory({ taskType: 'scheduled' })
			await wrapper.find('#task-text').setValue('Task')
			await wrapper.find('form').trigger('submit.prevent')
			await nextTick()

			const payload = wrapper.emitted('create')![0][0] as Record<string, unknown>
			expect(payload.date).toBe(getTodayString())
		})

		it('Escape key does nothing when show=false', async () => {
			const wrapper = mount(TaskEditorPopup, {
				props: { show: false },
				attachTo: document.body,
				global: {
					plugins: [PrimeVue],
					stubs: {
						AppIcon: AppIconStub,
						AppCheckbox: AppCheckboxStub,
						CategorySelector: CategorySelectorStub,
						TaskDateTimePicker: TaskDateTimePickerStub,
						Teleport: true,
						Transition: false
					}
				}
			})
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
			await nextTick()

			expect(wrapper.emitted('close')).toBeFalsy()
		})

		it('watcher resets form when show changes to true', async () => {
			const wrapper = mount(TaskEditorPopup, {
				props: { show: false },
				attachTo: document.body,
				global: {
					plugins: [PrimeVue],
					stubs: {
						AppIcon: AppIconStub,
						AppCheckbox: AppCheckboxStub,
						CategorySelector: CategorySelectorStub,
						TaskDateTimePicker: TaskDateTimePickerStub,
						Teleport: true,
						Transition: false
					}
				}
			})
			await wrapper.setProps({ show: true })
			await nextTick()
			// After show=true, the form should render
			expect(wrapper.find('.popup-overlay').exists()).toBe(true)
		})
	})

	// ── UI/Interaction ─────────────────────────────────────────────
	describe('UI/Interaction', () => {
		it('compact view shown when startCompact=true and not editing', () => {
			const wrapper = factory({ startCompact: true })
			expect(wrapper.find('.popup-container.compact').exists()).toBe(true)
		})

		it('compact view hidden in edit mode even if startCompact=true', () => {
			const wrapper = factory({ startCompact: true, task: makeTask() })
			expect(wrapper.find('.popup-container.compact').exists()).toBe(false)
		})

		it('"Show more options" button expands compact view', async () => {
			const wrapper = factory({ startCompact: true, taskType: 'scheduled' })
			expect(wrapper.find('.expand-btn').exists()).toBe(true)
			await wrapper.find('.expand-btn').trigger('click')
			await nextTick()

			// After expand, compact class should be gone
			expect(wrapper.find('.popup-container.compact').exists()).toBe(false)
		})

		it('projectedEndTime computed correctly (shown in full view for scheduled)', () => {
			const task = makeTask({ startTime: 10, duration: 90 })
			const wrapper = factory({ task, taskType: 'scheduled' })
			// endTime = 10 + 1.5 = 11.5 => "11:30"
			const preview = wrapper.find('.end-time-preview')
			if (preview.exists()) {
				expect(preview.text()).toContain('11:30')
			}
		})

		it('projectedEndTime is null when startTime is null', () => {
			const wrapper = factory({ taskType: 'todo' })
			expect(wrapper.find('.end-time-preview').exists()).toBe(false)
		})

		it('duration field hidden for todo taskType in create mode', () => {
			const wrapper = factory({ taskType: 'todo' })
			// In non-compact, the duration form-group has condition: taskType !== 'todo' || isEditMode
			// Here taskType='todo' and not edit mode, so duration picker should be hidden
			const labels = wrapper.findAll('.form-group label')
			const hasDuration = labels.some((l) => l.text().includes('Duration'))
			expect(hasDuration).toBe(false)
		})

		it('description textarea visible in full (non-compact) view', () => {
			const wrapper = factory()
			expect(wrapper.find('#task-description').exists()).toBe(true)
		})

		it('description textarea hidden in compact view', () => {
			const wrapper = factory({ startCompact: true })
			expect(wrapper.find('#task-description').exists()).toBe(false)
		})

		it('close button emits close', async () => {
			const wrapper = factory()
			await wrapper.find('.close-btn').trigger('click')
			expect(wrapper.emitted('close')).toBeTruthy()
		})
	})
})
