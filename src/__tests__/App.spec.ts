import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import App from '../App.vue'

// Mock all child components
vi.mock('../components/AppHeader.vue', () => ({
	default: { template: '<div class="app-header-stub" />' }
}))
vi.mock('../components/DragOperator.vue', () => ({
	default: { template: '<div class="drag-operator-stub" />' }
}))
vi.mock('../components/InterfaceManager.vue', () => ({
	default: { template: '<div class="interface-manager-stub" />' }
}))
vi.mock('../components/ThemePanel.vue', () => ({
	default: { template: '<div class="theme-panel-stub" />' }
}))
vi.mock('../components/ThemeTransitionOverlay.vue', () => ({
	default: { template: '<div class="theme-transition-stub" />' }
}))
vi.mock('../debug/DebugFAB.vue', () => ({
	default: { template: '<div class="debug-fab-stub" />' }
}))

// Mock composables
vi.mock('../composables/useGlobalShortcuts', () => ({
	useGlobalShortcuts: vi.fn()
}))
vi.mock('../composables/useSoundSystem', () => ({
	useSoundSystem: vi.fn()
}))
vi.mock('../composables/useNotificationSystem', () => ({
	useNotificationSystem: vi.fn()
}))
vi.mock('../composables/useTaskMonitor', () => ({
	useTaskMonitor: vi.fn()
}))

// Mock stores
let mockUser: any = null
let mockLoading = ref(true)

vi.mock('../stores/user', () => ({
	useUserStore: () => ({
		user: mockUser,
		loading: mockLoading
	})
}))

vi.mock('../stores/time', () => ({
	useTimeStore: () => ({
		startTicking: vi.fn()
	})
}))

// Mock pinia storeToRefs
vi.mock('pinia', async (importOriginal) => {
	const actual = (await importOriginal()) as any
	return {
		...actual,
		storeToRefs: (store: any) => {
			const { ref: vueRef } = require('vue')
			return {
				user: vueRef(store.user),
				loading: store.loading
			}
		}
	}
})

// Mock router-view
const mockRouterView = { template: '<div class="router-view-stub" />' }

describe('App.vue', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockUser = null
		mockLoading = ref(true)
	})

	function mountApp() {
		return mount(App, {
			global: {
				stubs: {
					'router-view': mockRouterView
				}
			}
		})
	}

	it('shows loading overlay when auth is loading', () => {
		mockLoading = ref(true)
		const wrapper = mountApp()

		expect(wrapper.find('.loading-overlay').exists()).toBe(true)
		expect(wrapper.text()).toContain('Checking authentication...')
	})

	it('shows main content when auth is done and user is logged in', () => {
		mockUser = { uid: 'test' }
		mockLoading = ref(false)
		const wrapper = mountApp()

		expect(wrapper.find('.loading-overlay').exists()).toBe(false)
		expect(wrapper.find('.app-header-stub').exists()).toBe(true)
		expect(wrapper.find('.app-main').exists()).toBe(true)
	})

	it('hides AppHeader when no user', () => {
		mockUser = null
		mockLoading = ref(false)
		const wrapper = mountApp()

		expect(wrapper.find('.app-header-stub').exists()).toBe(false)
	})

	it('always renders InterfaceManager and ThemeTransitionOverlay', () => {
		const wrapper = mountApp()

		expect(wrapper.find('.interface-manager-stub').exists()).toBe(true)
		expect(wrapper.find('.theme-transition-stub').exists()).toBe(true)
	})
})
