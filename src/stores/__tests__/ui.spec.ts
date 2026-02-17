import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUIStore } from '../ui'

describe('ui.ts', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
	})

	it('initializes with default state', () => {
		const store = useUIStore()
		expect(store.isThemePanelOpen).toBe(false)
		expect(store.createTaskTrigger).toBe(0)
		expect(store.themeTransitionState.isActive).toBe(false)
	})

	it('toggles theme panel', () => {
		const store = useUIStore()
		store.toggleThemePanel()
		expect(store.isThemePanelOpen).toBe(true)
		store.toggleThemePanel()
		expect(store.isThemePanelOpen).toBe(false)
	})

	it('closes theme panel', () => {
		const store = useUIStore()
		store.isThemePanelOpen = true
		store.closeThemePanel()
		expect(store.isThemePanelOpen).toBe(false)
	})

	it('triggers create task', () => {
		const store = useUIStore()
		store.triggerCreateTask()
		expect(store.createTaskTrigger).toBe(1)
	})

	it('starts theme transition', () => {
		const store = useUIStore()
		store.startThemeTransition(100, 200, 'dark')
		expect(store.themeTransitionState).toEqual({
			isActive: true,
			x: 100,
			y: 200,
			targetTheme: 'dark'
		})
	})
})
