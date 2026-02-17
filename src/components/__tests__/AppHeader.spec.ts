import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import AppHeader from '../AppHeader.vue'
import { useUserStore } from '../../stores/user'
import { useUIStore } from '../../stores/ui'

// Mock vue-router
const mockRoute = {
	name: 'day'
}
vi.mock('vue-router', () => ({
	useRoute: () => mockRoute,
	RouterLink: RouterLinkStub
}))

// Mock firebase stuff to prevent side effects in store
vi.mock('../../firebase', () => ({
	auth: {}
}))
vi.mock('firebase/auth', () => ({
	onAuthStateChanged: vi.fn(),
	getAuth: vi.fn(),
	signInWithPopup: vi.fn(),
	signOut: vi.fn()
}))

describe('AppHeader.vue', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockRoute.name = 'day'
	})

	const mounComponent = (initialUserState: any = null) => {
		return mount(AppHeader, {
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: false, // Allow actions to be called if we want (but checks imply spies)
						initialState: {
							user: { user: initialUserState },
							ui: { isThemePanelOpen: false }
						}
					})
				],
				stubs: {
					RouterLink: RouterLinkStub,
					AppLogo: true,
					AppIcon: true
				}
			}
		})
	}

	it('renders navigation links with correct active state', () => {
		mockRoute.name = 'day'
		const wrapper = mounComponent()

		const dayLink = wrapper.findAllComponents(RouterLinkStub).find((w) => w.text() === 'Day')
		expect(dayLink?.classes()).toContain('active')

		const weekLink = wrapper.findAllComponents(RouterLinkStub).find((w) => w.text() === 'Week')
		expect(weekLink?.classes()).not.toContain('active')
	})

	it('triggers create task action', async () => {
		const wrapper = mounComponent({ uid: '123' })
		const uiStore = useUIStore() // Get the store instance from the wrapper's pinia

		// Spy on the action manually because createTestingPinia spies might be tricky with setup stores?
		// Actually createTestingPinia should spy on actions automatically if stubActions is true (default).
		// But for Setup Stores, it's safer to spy explicitly or check if it works.
		vi.spyOn(uiStore, 'triggerCreateTask')

		await wrapper.vm.$nextTick()

		const btn = wrapper.find('.create-task-btn')
		expect(btn.exists()).toBe(true)
		await btn.trigger('click')

		expect(uiStore.triggerCreateTask).toHaveBeenCalled()
	})

	it('toggles theme panel', async () => {
		const wrapper = mounComponent({ uid: '123' })
		const uiStore = useUIStore()
		vi.spyOn(uiStore, 'toggleThemePanel')

		const btn = wrapper.find('.theme-btn-toggle')
		expect(btn.exists()).toBe(true)
		await btn.trigger('click')

		expect(uiStore.toggleThemePanel).toHaveBeenCalled()
	})

	it('renders user photo if available', async () => {
		const wrapper = mounComponent({ uid: '123', photoURL: 'http://test.com/photo.jpg' })

		const img = wrapper.find('.user-avatar')
		expect(img.exists()).toBe(true)
		expect(img.attributes('src')).toBe('http://test.com/photo.jpg')
	})

	it('renders placeholder if no photo', async () => {
		const wrapper = mounComponent({ uid: '123', photoURL: null, displayName: 'Alice' })

		expect(wrapper.find('.user-avatar').exists()).toBe(false)
		const placeholder = wrapper.find('.user-avatar-placeholder')
		expect(placeholder.exists()).toBe(true)
		expect(placeholder.text()).toBe('A')
	})

	it('hides right section if no user', async () => {
		const wrapper = mounComponent(null)
		expect(wrapper.find('.header-right').exists()).toBe(false)
	})
})
