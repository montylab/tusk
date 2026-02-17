import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import ThemeTransitionOverlay from '../ThemeTransitionOverlay.vue'
import { useUIStore } from '../../stores/ui'
import { useAppearanceStore } from '../../stores/appearance'

describe('ThemeTransitionOverlay.vue', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	const mountComponent = () => {
		return mount(ThemeTransitionOverlay, {
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						initialState: {
							ui: {
								themeTransitionState: {
									isActive: false,
									targetTheme: null,
									x: 0,
									y: 0
								}
							},
							appearance: {
								theme: 'light'
							}
						}
					})
				],
				stubs: {
					Teleport: true
				}
			}
		})
	}

	it('does not render when transition is not active', () => {
		const wrapper = mountComponent()
		expect(wrapper.find('.theme-transition-overlay').exists()).toBe(false)
	})

	it('starts transition when isActive becomes true', async () => {
		const wrapper = mountComponent()
		const uiStore = useUIStore()
		const appearanceStore = useAppearanceStore()

		// Trigger transition
		uiStore.themeTransitionState = {
			isActive: true,
			targetTheme: 'dark',
			x: 100,
			y: 200
		}

		await nextTick()
		expect(wrapper.find('.theme-transition-overlay').exists()).toBe(true)

		const circle = wrapper.find('.transition-circle')
		expect(circle.exists()).toBe(true)
		expect(circle.attributes('style')).toContain('left: 100px')
		expect(circle.attributes('style')).toContain('top: 200px')

		// Wait for nextTick and rAF
		await nextTick()
		await vi.runAllTimersAsync()

		// Phase 1: Expansion and theme update
		// theme update happens in first setTimeout (100ms)
		expect(appearanceStore.theme).toBe('dark')

		// Phase 2: Pause and shrink
		// The full chain takes 100ms + 100ms + 600ms = 800ms

		// After all timers, overlay should be gone and isActive reset
		expect(wrapper.find('.theme-transition-overlay').exists()).toBe(false)
		expect(uiStore.themeTransitionState.isActive).toBe(false)
	})
})
