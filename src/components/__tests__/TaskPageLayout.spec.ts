import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import TaskPageLayout from '../TaskPageLayout.vue'
import PrimeVue from 'primevue/config'
import { createTestingPinia } from '@pinia/testing'

// ── Stubs ──────────────────────────────────────────────────────────
const TaskPileStub = defineComponent({
	name: 'TaskPile',
	props: ['title', 'tasks', 'listType'],
	emits: ['edit'],
	setup(props) {
		return () => h('div', { class: 'task-pile-stub', 'data-title': props.title })
	}
})

const ResizablePanelStub = defineComponent({
	name: 'ResizablePanel',
	props: ['side', 'minSize', 'maxSize', 'defaultSize', 'storageKey'],
	setup(_, { slots }) {
		return () => h('div', { class: 'resizable-panel-stub' }, slots.default?.())
	}
})

beforeAll(() => {
	config.global.plugins = [PrimeVue]
	config.global.stubs = {
		TaskPile: TaskPileStub,
		ResizablePanel: ResizablePanelStub
	}
})

// ── Helpers ────────────────────────────────────────────────────────
function factory(opts: { slotContent?: string } = {}) {
	return mount(TaskPageLayout, {
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
					initialState: {
						tasks: {
							tasks: {}
						}
					}
				})
			]
		},
		slots: {
			default: opts.slotContent || '<div class="slot-default">Main</div>',
			header: '<div class="slot-header">Header</div>',
			popups: '<div class="slot-popups">Popup</div>'
		}
	})
}

// ── Tests ──────────────────────────────────────────────────────────
describe('TaskPageLayout.vue', () => {
	describe('Happy Path', () => {
		it('renders main content area with slots', () => {
			const wrapper = factory()
			expect(wrapper.find('.main-content .slot-header').exists()).toBe(true)
			expect(wrapper.find('.main-content .slot-default').exists()).toBe(true)
			expect(wrapper.find('.main-content .slot-popups').exists()).toBe(true)
		})

		it('renders sidebar with TaskPile for shortcuts', () => {
			const wrapper = factory()
			const piles = wrapper.findAllComponents(TaskPileStub)
			const shortcutPile = piles.find((p) => p.props('title') === 'Shortcuts')
			expect(shortcutPile).toBeTruthy()
			expect(shortcutPile!.props('listType')).toBe('shortcut')
		})

		it('renders sidebar with TaskPile for todos', () => {
			const wrapper = factory()
			const piles = wrapper.findAllComponents(TaskPileStub)
			const todoPile = piles.find((p) => p.props('title') === 'To Do')
			expect(todoPile).toBeTruthy()
			expect(todoPile!.props('listType')).toBe('todo')
		})

		it("emits 'edit' when TaskPile emits edit", async () => {
			const wrapper = factory()
			const piles = wrapper.findAllComponents(TaskPileStub)
			const mockTask = { id: '1', text: 'Test' }
			await piles[0].vm.$emit('edit', mockTask)
			expect(wrapper.emitted('edit')).toBeTruthy()
			expect(wrapper.emitted('edit')![0][0]).toEqual(mockTask)
		})
	})

	describe('Edge Cases', () => {
		it('renders with empty tasks arrays', () => {
			const wrapper = factory()
			const piles = wrapper.findAllComponents(TaskPileStub)
			expect(piles.length).toBe(2) // Shortcuts + To Do
		})
	})
})
