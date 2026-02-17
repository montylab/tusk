// Polyfill ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
} as unknown as typeof ResizeObserver

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { ref } from 'vue'
import TrashBasket from '../TrashBasket.vue'

// ── Mocks ──────────────────────────────────────────────────────────
const mockRegisterZone = vi.fn()
const mockUnregisterZone = vi.fn()
const mockUpdateZoneBounds = vi.fn()
const mockCurrentZone = ref<string | null>(null)

vi.mock('../../composables/useDragOperator', () => ({
	useDragOperator: () => ({
		currentZone: mockCurrentZone,
		registerZone: mockRegisterZone,
		unregisterZone: mockUnregisterZone,
		updateZoneBounds: mockUpdateZoneBounds
	})
}))

const AppIconStub = {
	template: '<div class="app-icon-stub"></div>'
}

beforeAll(() => {
	config.global.stubs = {
		AppIcon: AppIconStub
	}
})

// ── Helpers ────────────────────────────────────────────────────────
function factory() {
	return mount(TrashBasket)
}

// ── Tests ──────────────────────────────────────────────────────────
describe('TrashBasket.vue', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockCurrentZone.value = null
	})

	describe('Happy Path', () => {
		it('renders trash icon and label', () => {
			const wrapper = factory()
			expect(wrapper.find('.app-icon-stub').exists()).toBe(true)
			expect(wrapper.find('.label').text()).toBe('Delete')
		})

		it('active state when currentZone is "trash"', async () => {
			const wrapper = factory()
			mockCurrentZone.value = 'trash'
			await wrapper.vm.$nextTick()
			expect(wrapper.find('.trash-basket').classes()).toContain('active')
		})

		it('registers zone on mount', () => {
			factory()
			expect(mockRegisterZone).toHaveBeenCalledWith('trash', expect.any(Object))
		})

		it('unregisters zone on unmount', () => {
			const wrapper = factory()
			wrapper.unmount()
			expect(mockUnregisterZone).toHaveBeenCalledWith('trash')
		})
	})
})
