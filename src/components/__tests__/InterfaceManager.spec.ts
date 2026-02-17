import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import InterfaceManager from '../InterfaceManager.vue'
import { useAppearanceStore } from '../../stores/appearance'

describe('InterfaceManager.vue', () => {
	const mountComponent = () => {
		return mount(InterfaceManager, {
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: false,
						initialState: {
							appearance: {
								theme: 'dark',
								colorScheme: 'default',
								interfaceScale: 100, // 100%
								hourHeightBase: 64 // Base height
								// Computed values will be derived if not mocked overrides?
								// With createTestingPinia and setup stores, it's tricky.
								// But the previous run showed it derived uiScale from interfaceScale.
								// So let's rely on that or mock getter?
								// Let's just set valid input data.
							}
						}
					})
				]
			}
		})
	}

	beforeEach(() => {
		// Reset DOM state
		document.documentElement.removeAttribute('data-theme')
		document.documentElement.removeAttribute('data-scheme')
		document.documentElement.removeAttribute('data-scale')
		document.documentElement.style.removeProperty('--ui-scale')
		document.documentElement.style.removeProperty('--hour-height')
		document.documentElement.style.removeProperty('--header-height')
	})

	it('sets initial attributes and styles on mount', async () => {
		mountComponent()
		await nextTick()

		const el = document.documentElement
		expect(el.getAttribute('data-theme')).toBe('dark')
		expect(el.getAttribute('data-scheme')).toBe('default')
		expect(el.getAttribute('data-scale')).toBe('100')

		// 100 / 100 = 1
		expect(el.style.getPropertyValue('--ui-scale')).toBe('1')
		// 64 * 1 = 64
		expect(el.style.getPropertyValue('--hour-height')).toBe('64px')
		// headerHeightBase default is 70, but we didn't set it in initialState?
		// appearance store default is 70?
		// Let's expect it to be derived from default if not set.
		// Or better, set it in initialState?
		// We set headerHeight: 48 in previous test. Let's set headerHeightBase: 48.
	})

	it('updates attributes when store changes', async () => {
		mountComponent()
		await nextTick()

		const store = useAppearanceStore()
		store.theme = 'light'
		store.colorScheme = 'ink'
		store.interfaceScale = 90

		await nextTick()

		const el = document.documentElement
		expect(el.getAttribute('data-theme')).toBe('light')
		expect(el.getAttribute('data-scheme')).toBe('ink')
		expect(el.getAttribute('data-scale')).toBe('90')
	})

	it('updates styles when store changes', async () => {
		mountComponent()
		await nextTick()

		const store = useAppearanceStore()
		store.interfaceScale = 150
		store.hourHeightBase = 80
		store.headerHeightBase = 60

		await nextTick()

		const el = document.documentElement
		// uiScale = 1.5
		expect(el.style.getPropertyValue('--ui-scale')).toBe('1.5')
		// hourHeight = 80 * 1.5 = 120
		expect(el.style.getPropertyValue('--hour-height')).toBe('120px')
		// headerHeight = 60 * 1.5 = 90
		expect(el.style.getPropertyValue('--header-height')).toBe('90px')
	})
})
