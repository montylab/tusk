import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { useUserStore } from './user'
import * as firebaseService from '../services/firebaseService'

export interface UserSettings {
	defaultStartHour?: number
	snapMinutes?: number
	categoryColors: string[]
	notifications: {
		enabled: boolean
		taskStarted: boolean
		taskEnded: boolean
	}
	sounds: {
		enabled: boolean
		taskStarted: boolean
		taskEnded: boolean
		taskDeleted: boolean
	}
	onboarded?: boolean
}

export const defaultColors = [
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

export const tailwindColors = [
	'#f43f5e', // Rose 500
	'#ef4444', // Red 500
	'#f97316', // Orange 500
	'#f59e0b', // Amber 500
	'#84cc16', // Lime 500
	'#10b981', // Emerald 500
	'#06b6d4', // Cyan 500
	'#3b82f6', // Blue 500
	'#6366f1', // Indigo 500
	'#8b5cf6', // Violet 500
	'#d946ef', // Fuchsia 500
	'#ec4899' // Pink 500
]
export const radixColors = [
	'#e5484d', // Tomato
	'#f76808', // Orange
	'#ffb224', // Amber
	'#99d52a', // Lime
	'#30a46c', // Jade
	'#00a2ad', // Teal
	'#0091ff', // Blue
	'#3e63dd', // Indigo
	'#6e56cf', // Violet
	'#ab4aba', // Plum
	'#e93d82', // Pink
	'#60646c' // Gray
]
export const ibmCarbonColors = [
	'#8a3ffc', // Purple 60
	'#33b1ff', // Cyan 40
	'#007d79', // Teal 60
	'#ff7eb6', // Magenta 40
	'#fa4d56', // Red 50
	'#fff1f1', // Red 10
	'#6f1414', // Red 90
	'#4589ff', // Blue 50
	'#d2a106', // Gold 40
	'#08bdba', // Teal 40
	'#bae6ff', // Cyan 20
	'#ba7032' // Orange 40
]

const DEFAULT_SETTINGS: UserSettings = {
	snapMinutes: 15,
	defaultStartHour: 9,
	categoryColors: tailwindColors,
	notifications: {
		enabled: true,
		taskStarted: true,
		taskEnded: true
	},
	sounds: {
		enabled: true,
		taskStarted: true,
		taskEnded: true,
		taskDeleted: true
	},
	onboarded: false
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

			if (settingsData.value.onboarded === false) {
				// We don't want to import onboardingService here to avoid circular dep
				import('../services/onboardingService').then(({ runOnboarding }) => {
					runOnboarding()
				})
			}
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
