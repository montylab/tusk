import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../stores/user'
import DayViewPage from '../views/DayViewPage.vue'
import WeekViewPage from '../views/WeekViewPage.vue'
import MonthViewPage from '../views/MonthViewPage.vue'
import SettingsPage from '../views/SettingsPage.vue'
import SignInPage from '../views/SignInPage.vue'
import SignOutPage from '../views/SignOutPage.vue'

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		name: 'home',
		component: DayViewPage,
		meta: { requiresAuth: true }
	},
	{
		path: '/day/:date?',
		name: 'day',
		component: DayViewPage,
		meta: { requiresAuth: true }
	},
	{
		path: '/week/:date?',
		name: 'week',
		component: WeekViewPage,
		meta: { requiresAuth: true }
	},
	{
		path: '/month/:date?',
		name: 'month',
		component: MonthViewPage,
		meta: { requiresAuth: true }
	},
	{
		path: '/month/:year?/:month?/:day?',
		name: 'month-ymd',
		component: MonthViewPage,
		meta: { requiresAuth: true }
	},
	{
		path: '/settings',
		name: 'settings',
		component: SettingsPage,
		meta: { requiresAuth: true }
	},
	{
		path: '/signin',
		name: 'signin',
		component: SignInPage,
		meta: { requiresAuth: false }
	},
	{
		path: '/signout',
		name: 'signout',
		component: SignOutPage,
		meta: { requiresAuth: false }
	}
]

if (import.meta.env.DEV) {
	routes.push({
		path: '/debug/colors',
		name: 'debug-colors',
		component: () => import('../debug/ColorSchemeDebug.vue'),
		meta: { requiresAuth: false }
	})
}

const router = createRouter({
	history: createWebHistory(),
	routes
})

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
	const userStore = useUserStore()

	// Wait for auth state to be confirmed
	if (userStore.loading) {
		// Wait for auth check to complete
		const unwatch = userStore.$subscribe((_mutation, state) => {
			if (!state.loading) {
				unwatch()
				checkAuth()
			}
		})
	} else {
		checkAuth()
	}

	function checkAuth() {
		const requiresAuth = to.meta.requiresAuth
		const isAuthenticated = !!userStore.user

		if (requiresAuth && !isAuthenticated) {
			// Redirect to sign in if not authenticated
			next({ name: 'signin' })
		} else if (!requiresAuth && isAuthenticated && to.name === 'signin') {
			// Redirect to home if already authenticated and trying to access signin
			next({ name: 'home' })
		} else {
			next()
		}
	}
})

export default router
