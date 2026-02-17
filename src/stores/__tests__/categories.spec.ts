import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCategoriesStore } from '../categories'
import * as firebaseService from '../../services/firebaseService'
import { nextTick } from 'vue'

import { useUserStore } from '../user'

// --- Mocks ---

// Mock Firebase Service
vi.mock('../../services/firebaseService', () => ({
	subscribeToCategories: vi.fn(),
	createCategory: vi.fn(),
	updateCategory: vi.fn(),
	deleteCategory: vi.fn()
}))

// Mock User Store
vi.mock('../user', () => {
	const { reactive } = require('vue')
	const userState = reactive({
		user: null
	})
	return {
		useUserStore: () => userState
	}
})

describe('categories store', () => {
	let store: ReturnType<typeof useCategoriesStore>
	// We need to access the mocked user store to trigger changes
	// Since we mocked '../user', importing it gives us the mocked version (or we can access via useUserStore internally if it was a singleton, but pinia stores are singletons per root)
	// However, we used a factory that returns a new object? No, the mock factory runs once (or per reset?).
	// Actually, best to just rely on the fact that useUserStore() returns the SAME object if we defined it that way, or let's see.
	// In our mock above: `useUserStore: () => ({ user })`. `user` is created *once* when module is loaded. Good.

	// We can't easily import useUserStore from '../user' here if it wasn't exported in the original file?
	// It IS exported.

	const userStore = useUserStore()

	beforeEach(() => {
		setActivePinia(createPinia())
		userStore.user = null
		vi.clearAllMocks()
		store = useCategoriesStore()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	// --- Happy Path ---

	it('subscribes to categories when user logs in', async () => {
		// Mock subscription callback immediately
		const mockData = [{ id: 'cat1', name: 'Work', order: 1 }]
		vi.mocked(firebaseService.subscribeToCategories).mockImplementation((cb) => {
			cb(mockData)
			return () => {} // unsubscribe function
		})

		// Trigger login
		userStore.user = { uid: 'test-user' } as any
		await nextTick()

		// Verify subscription
		expect(firebaseService.subscribeToCategories).toHaveBeenCalled()

		// Verify state update
		expect(store.categoriesArray).toHaveLength(1)
		expect(store.categoriesMap['cat1']).toEqual(mockData[0])

		// Verify loading state (should be false after data)
		expect(store.loading).toBe(false)
	})

	it('clears state and unsubscribes when user logs out', async () => {
		const mockUnsub = vi.fn()
		vi.mocked(firebaseService.subscribeToCategories).mockReturnValue(mockUnsub)

		// Login
		userStore.user = { uid: 'test-user' } as any
		await nextTick()
		expect(firebaseService.subscribeToCategories).toHaveBeenCalled()

		// Populate some state
		store.categoriesMap = { cat1: { id: 'cat1', name: 'Work', color: 'red', order: 1 } }

		// Logout
		userStore.user = null
		await nextTick()

		// Verify cleanup
		expect(store.categoriesArray).toHaveLength(0)
		expect(Object.keys(store.categoriesMap)).toHaveLength(0)
		expect(mockUnsub).toHaveBeenCalled()
	})

	it('calls createCategory when adding a category', async () => {
		// Setup initial state for order calculation
		store.categoriesMap = {
			cat1: { id: 'cat1', name: 'Existing', color: 'blue', order: 10 }
		}

		vi.mocked(firebaseService.createCategory).mockResolvedValue({ id: 'new-id' })

		const result = await store.addCategory('New Cat', '#ff0000', true)

		expect(firebaseService.createCategory).toHaveBeenCalledWith({
			name: 'New Cat',
			color: '#ff0000',
			order: 20, // 10 + 10
			isDeepWork: true
		})
		expect(result).toEqual({ id: 'new-id' })
	})

	it('calls updateCategory with correct args', async () => {
		await store.updateCategory('cat1', { name: 'Updated' })
		expect(firebaseService.updateCategory).toHaveBeenCalledWith('cat1', { name: 'Updated' })
	})

	it('calls deleteCategory with correct args', async () => {
		await store.deleteCategory('cat1')
		expect(firebaseService.deleteCategory).toHaveBeenCalledWith('cat1')
	})

	it('ensureCategoryExists returns existing category without API call', async () => {
		store.categoriesMap = {
			cat1: { id: 'cat1', name: 'Work', color: 'red', order: 1 }
		}

		const result = await store.ensureCategoryExists('Work', '#0000ff') // Different color shouldn't matter for query

		expect(result.id).toBe('cat1')
		expect(firebaseService.createCategory).not.toHaveBeenCalled()
	})

	it('ensureCategoryExists creates new category if not found', async () => {
		store.categoriesMap = {}
		vi.mocked(firebaseService.createCategory).mockResolvedValue({ id: 'new-cat' })

		const result = await store.ensureCategoryExists('New Cat', '#00ff00', true)

		expect(firebaseService.createCategory).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'New Cat',
				color: '#00ff00',
				isDeepWork: true
			})
		)
		expect(result.id).toBe('new-cat')
		expect(result.name).toBe('New Cat')
	})

	it('remaps palette correctly', async () => {
		store.categoriesMap = {
			c1: { id: 'c1', name: 'A', order: 1, color: 'old' },
			c2: { id: 'c2', name: 'B', order: 2, color: 'old' },
			c3: { id: 'c3', name: 'C', order: 3, color: 'old' }
		}

		const palette = ['#111', '#222'] // only 2 colors for 3 cats

		await store.remapCategoriesToPalette(palette)

		expect(firebaseService.updateCategory).toHaveBeenCalledTimes(3)
		expect(firebaseService.updateCategory).toHaveBeenCalledWith('c1', { color: '#111' })
		expect(firebaseService.updateCategory).toHaveBeenCalledWith('c2', { color: '#222' })
		expect(firebaseService.updateCategory).toHaveBeenCalledWith('c3', { color: '#111' }) // cycled
	})

	// --- Edge Cases ---

	it('handles service errors gracefully', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.mocked(firebaseService.createCategory).mockRejectedValue(new Error('Network error'))

		await store.addCategory('Fail', '#000')

		expect(store.error).toBe('Failed to add category')
		expect(consoleSpy).toHaveBeenCalled()
		consoleSpy.mockRestore()
	})

	it('handles empty firebase data', () => {
		vi.mocked(firebaseService.subscribeToCategories).mockImplementation((cb) => {
			cb([]) // empty list
			return () => {}
		})

		userStore.user = { uid: 'u1' } as any

		expect(store.categoriesArray).toEqual([])
		expect(store.categoriesMap).toEqual({})
	})
})
