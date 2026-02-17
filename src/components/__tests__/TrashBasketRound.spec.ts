// Polyfill ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
} as unknown as typeof ResizeObserver

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { ref } from 'vue'
import TrashBasketRound from '../TrashBasketRound.vue'

// ── Mocks ──────────────────────────────────────────────────────────
const mockRegisterZone = vi.fn()
const mockUnregisterZone = vi.fn()
const mockUpdateZoneBounds = vi.fn()
const mockCurrentZone = ref<string | null>(null)
const mockIsDestroying = ref(false)

vi.mock('../../composables/useDragOperator', () => ({
	useDragOperator: () => ({
		currentZone: mockCurrentZone,
		isDestroying: mockIsDestroying,
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
	return mount(TrashBasketRound)
}

// ── Tests ──────────────────────────────────────────────────────────
describe('TrashBasketRound.vue', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockCurrentZone.value = null
		mockIsDestroying.value = false
	})

	describe('Happy Path', () => {
		it('renders round basket', () => {
			const wrapper = factory()
			expect(wrapper.find('.trash-basket-round').exists()).toBe(true)
			expect(wrapper.find('.app-icon-stub').exists()).toBe(true)
		})

		it('applies is-over class when currentZone is "trash"', async () => {
			const wrapper = factory()
			mockCurrentZone.value = 'trash'
			await wrapper.vm.$nextTick()
			expect(wrapper.find('.trash-basket-round').classes()).toContain('is-over')
		})

		it('applies is-destroying class when destroying', async () => {
			const wrapper = factory()
			mockIsDestroying.value = true
			await wrapper.vm.$nextTick()
			expect(wrapper.find('.trash-basket-round').classes()).toContain('is-destroying')
		})

		it('registers zone on mount', () => {
			factory()
			expect(mockRegisterZone).toHaveBeenCalledWith('trash', expect.any(Object))
		})
	})

	describe('Edge Cases', () => {
		it('updates bounds on mouseover', async () => {
			const wrapper = factory()
			await wrapper.find('.trash-basket-round').trigger('mouseover')
			expect(mockUpdateZoneBounds).toHaveBeenCalled()
		})
	})
})
