import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { useUserStore } from './user'
import * as firebaseService from '../services/firebaseService'

export interface UserSettings {
	defaultStartHour?: number
	snapMinutes?: number
	categoryColors: string[]
}

const DEFAULT_SETTINGS: UserSettings = {
	snapMinutes: 15,
	defaultStartHour: 9,
	categoryColors: [
		'#ef4444', // Red
		'#f97316', // Orange
		'#f59e0b', // Amber
		'#84cc16', // Lime
		'#22c55e', // Green
		'#06b6d4', // Cyan
		'#3b82f6', // Blue
		'#8b5cf6', // Violet
		'#d946ef' // Fuchsia
	]
}

export const useSettingsStore = defineStore('settings', () => {
	const userStore = useUserStore()
	const settingsData = ref<UserSettings>({ ...DEFAULT_SETTINGS })
	const loading = ref(false)

	const settings = computed(() => ({
		...DEFAULT_SETTINGS,
		...settingsData.value
	}))

	let unsub: (() => void) | null = null

	watch(
		() => userStore.user,
		(u) => {
			if (u) {
				setupSync()
			} else {
				settingsData.value = { ...DEFAULT_SETTINGS }
				if (unsub) {
					unsub()
					unsub = null
				}
			}
		},
		{ immediate: true }
	)

	function setupSync() {
		loading.value = true
		if (unsub) unsub()
		unsub = firebaseService.subscribeToSettings((data) => {
			settingsData.value = { ...DEFAULT_SETTINGS, ...data }
			loading.value = false
		})
	}

	async function updateSettings(updates: Partial<UserSettings>) {
		await firebaseService.updateSettings(updates)
	}

	function getRandomCategoryColor() {
		const colors = settings.value.categoryColors
		return colors[Math.floor(Math.random() * colors.length)]
	}

	return {
		settings,
		loading,
		updateSettings,
		getRandomCategoryColor
	}
})
