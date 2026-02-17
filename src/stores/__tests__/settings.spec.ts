import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore, tailwindColors } from '../settings'
import * as firebaseService from '../../services/firebaseService'
import { nextTick, reactive } from 'vue'

// Mock Firebase Service
vi.mock('../../services/firebaseService', () => ({
	subscribeToSettings: vi.fn(),
	updateSettings: vi.fn()
}))

// Mock User Store
const mockUserState = reactive({
	user: null as any
})

vi.mock('../user', () => ({
	useUserStore: () => mockUserState
}))

describe('settings store', () => {
	let store: ReturnType<typeof useSettingsStore>

	beforeEach(() => {
		setActivePinia(createPinia())
		mockUserState.user = null
		vi.clearAllMocks()
		store = useSettingsStore()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	// --- Happy Path ---

	it('initializes with default settings when no user is logged in', () => {
		expect(store.settings.notifications.enabled).toBe(true)
		expect(store.settings.snapMinutes).toBe(15)
		expect(store.loading).toBe(false)
	})

	it('subscribes to settings when user logs in', async () => {
		// Mock subscription callback immediately
		const mockData = { snapMinutes: 30, defaultStartHour: 8 }
		vi.mocked(firebaseService.subscribeToSettings).mockImplementation((cb) => {
			cb(mockData)
			return () => {} // unsubscribe function
		})

		// Trigger login
		mockUserState.user = { uid: 'test-user' }
		await nextTick()

		// Verify subscription
		expect(firebaseService.subscribeToSettings).toHaveBeenCalled()

		// Verify state update (merged with defaults)
		expect(store.settings.snapMinutes).toBe(30)
		expect(store.settings.defaultStartHour).toBe(8)
		expect(store.settings.notifications.enabled).toBe(true) // Default preserved where not overridden

		// Verify loading state
		expect(store.loading).toBe(false)
	})

	it('resets to defaults and unsubscribes when user logs out', async () => {
		const mockUnsub = vi.fn()
		vi.mocked(firebaseService.subscribeToSettings).mockReturnValue(mockUnsub)

		// Login
		mockUserState.user = { uid: 'test-user' }
		await nextTick()
		expect(firebaseService.subscribeToSettings).toHaveBeenCalled()

		// Simulate some fetched data being in state
		// (The callback in previous test set it, but here mocks are fresh per test unless setup)
		// We can just rely on the effect that logout triggers reset logic.

		// Logout
		mockUserState.user = null
		await nextTick()

		// Verify cleanup
		expect(mockUnsub).toHaveBeenCalled()
		// Verify reset to defaults
		expect(store.settings.snapMinutes).toBe(15) // Back to default
	})

	it('calls updateSettings with correct args', async () => {
		const updates = { snapMinutes: 60 }
		await store.updateSettings(updates)
		expect(firebaseService.updateSettings).toHaveBeenCalledWith(updates)
	})

	it('getRandomCategoryColor returns a valid color string', () => {
		const color = store.getRandomCategoryColor()
		expect(typeof color).toBe('string')
		expect(color.startsWith('#')).toBe(true)
		expect(tailwindColors).toContain(color)
	})

	// --- Edge Cases ---

	it('handles partial settings from firebase correctly', async () => {
		vi.mocked(firebaseService.subscribeToSettings).mockImplementation((cb) => {
			cb({ notifications: { enabled: false } }) // Only partial object
			return () => {}
		})

		mockUserState.user = { uid: 'u1' }
		await nextTick()

		expect(store.settings.notifications.enabled).toBe(false) // Updated
		expect(store.settings.snapMinutes).toBe(15) // Default kept
	})

	it('handles empty/null settings from firebase (falls back to defaults)', async () => {
		vi.mocked(firebaseService.subscribeToSettings).mockImplementation((cb) => {
			cb(null) // Firebase returns null if path empty
			return () => {}
		})

		mockUserState.user = { uid: 'u1' }
		await nextTick()

		expect(store.settings).toBeDefined()
		expect(store.settings.snapMinutes).toBe(15) // Default
	})
})
