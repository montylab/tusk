import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockUserStore, triggerSubscription } = vi.hoisted(() => {
	const subscribers: any[] = []
	const store = {
		user: null as any,
		loading: false,
		$subscribe: vi.fn((cb) => {
			subscribers.push(cb)
			return () => {
				const idx = subscribers.indexOf(cb)
				if (idx > -1) subscribers.splice(idx, 1)
			}
		})
	}
	return {
		mockUserStore: store,
		triggerSubscription: (state: any) => {
			subscribers.forEach((cb) => cb({}, state))
		}
	}
})

vi.mock('../../stores/user', () => ({
	useUserStore: () => mockUserStore
}))

import router from '../index'

// Mock components
vi.mock('../views/DayViewPage.vue', () => ({ default: { template: '<div>DayView</div>' } }))
vi.mock('../views/WeekViewPage.vue', () => ({ default: { template: '<div>WeekView</div>' } }))
vi.mock('../views/MonthViewPage.vue', () => ({ default: { template: '<div>MonthView</div>' } }))
vi.mock('../views/SettingsPage.vue', () => ({ default: { template: '<div>Settings</div>' } }))
vi.mock('../views/SignInPage.vue', () => ({ default: { template: '<div>SignIn</div>' } }))
vi.mock('../views/SignOutPage.vue', () => ({ default: { template: '<div>SignOut</div>' } }))

describe('Router', () => {
	const userStore = mockUserStore

	beforeEach(async () => {
		// Reset store state
		userStore.user = null
		userStore.loading = false
		vi.clearAllMocks()

		// Reset router
		await router.push('/')
		await router.isReady()
	})

	it('Route Definitions', () => {
		const routes = router.getRoutes()
		const routeNames = routes.map((r) => r.name)

		expect(routeNames).toContain('home')
		expect(routeNames).toContain('week')
		expect(routeNames).toContain('month')
		expect(routeNames).toContain('settings')
		expect(routeNames).toContain('signin')

		// Check dynamic param
		const dayRoute = routes.find((r) => r.name === 'day')
		expect(dayRoute?.path).toContain('/day/:date?')
	})

	it('Public Access (Signin)', async () => {
		await router.push('/signin')
		expect(router.currentRoute.value.name).toBe('signin')
	})

	it('Protected Access (Unauthenticated) -> Redirects to Signin', async () => {
		userStore.user = null
		try {
			await router.push('/settings')
		} catch (e) {
			// Navigation failure expected if redirect happens mid-navigation
		}
		expect(router.currentRoute.value.name).toBe('signin')
	})

	it('Protected Access (Authenticated) -> Allows', async () => {
		userStore.user = { uid: '123' } // Authenticated
		await router.push('/settings')
		expect(router.currentRoute.value.name).toBe('settings')
	})

	it('Redirect to Home (Already Authenticated)', async () => {
		userStore.user = { uid: '123' }

		// Move away from signin first (where beforeEach puts us) so we can trigger guard
		await router.push('/settings')
		expect(router.currentRoute.value.name).toBe('settings')

		// Now try to access signin
		await router.push('/signin')

		// Should be redirected to home
		expect(router.currentRoute.value.name).toBe('home')
	})

	it('Deep Linking (Day View)', async () => {
		userStore.user = { uid: '123' }
		await router.push('/day/2024-01-01')
		expect(router.currentRoute.value.name).toBe('day')
		expect(router.currentRoute.value.params.date).toBe('2024-01-01')
	})

	it('Auth Loading State -> Waits then Redirects', async () => {
		userStore.loading = true
		userStore.user = null

		// Trigger navigation
		const navigationPromise = router.push('/settings')

		// Simulate loading finish
		userStore.loading = false
		triggerSubscription({ loading: false })

		try {
			await navigationPromise
		} catch (e) {}

		expect(router.currentRoute.value.name).toBe('signin')
	})
})
