import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Category } from '../types'
import * as firebaseService from '../services/firebaseService'
import { useUserStore } from './user'

export const useCategoriesStore = defineStore('categories', () => {
	const userStore = useUserStore()

	// --- State ---
	const categoriesMap = ref<Record<string, Category>>({})
	const loading = ref(false)
	const error = ref<string | null>(null)

	let unsub: (() => void) | null = null

	// --- Getters ---
	const categoriesArray = computed(() => {
		return Object.values(categoriesMap.value).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
	})

	const getCategoryById = (id: string) => categoriesMap.value[id]

	// --- Sync Logic ---
	watch(
		() => userStore.user,
		(newUser) => {
			if (newUser) {
				setupSync()
			} else {
				clearState()
			}
		},
		{ immediate: true }
	)

	function clearState() {
		categoriesMap.value = {}
		if (unsub) {
			unsub()
			unsub = null
		}
	}

	function setupSync() {
		clearState()
		loading.value = true
		unsub = firebaseService.subscribeToCategories((categories) => {
			const map: Record<string, Category> = {}
			categories.forEach((cat) => {
				map[cat.id] = cat
			})

			// If empty, we could seed defaults here, but better to just let them be empty
			// and handle defaults in the UI or creation.

			categoriesMap.value = map
			loading.value = false
		})
	}

	// --- Actions ---
	const addCategory = async (name: string, color: string, isDeepWork: boolean = false) => {
		try {
			const maxOrder = categoriesArray.value.length > 0 ? Math.max(...categoriesArray.value.map((c) => c.order ?? 0)) : 0

			const newCategory: Omit<Category, 'id'> = {
				name,
				color,
				order: maxOrder + 10,
				isDeepWork
			}
			return await firebaseService.createCategory(newCategory)
		} catch (err) {
			console.error(err)
			error.value = 'Failed to add category'
		}
	}

	const updateCategory = async (id: string, updates: Partial<Category>) => {
		try {
			await firebaseService.updateCategory(id, updates)
		} catch (err) {
			console.error(err)
			error.value = 'Failed to update category'
		}
	}

	const deleteCategory = async (id: string) => {
		try {
			await firebaseService.deleteCategory(id)
		} catch (err) {
			console.error(err)
			error.value = 'Failed to delete category'
		}
	}

	const ensureCategoryExists = async (name: string, defaultColor: string, isDeepWork: boolean = false): Promise<Category> => {
		const existing = categoriesArray.value.find((c) => c.name.toLowerCase() === name.toLowerCase())
		if (existing) return existing

		const { id } = await addCategory(name, defaultColor, isDeepWork)
		return { id, name, color: defaultColor, order: 0, isDeepWork } // order doesn't matter much for return
	}

	const remapCategoriesToPalette = async (palette: string[]) => {
		const categories = categoriesArray.value
		await Promise.all(
			categories.map((cat, index) => {
				const newColor = palette[index % palette.length]
				return updateCategory(cat.id, { color: newColor })
			})
		)
	}

	return {
		categoriesMap,
		categoriesArray,
		loading,
		error,
		getCategoryById,
		addCategory,
		updateCategory,
		deleteCategory,
		ensureCategoryExists,
		remapCategoriesToPalette
	}
})
