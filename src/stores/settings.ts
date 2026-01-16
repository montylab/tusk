import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { useUserStore } from './user'
import * as firebaseService from '../services/firebaseService'

export interface UserSettings {
	defaultStartHour?: number
	theme?: 'light' | 'dark' | 'pinky' | 'vivid'
	colorScheme?: 'pastel' | 'brisky' | 'royal'
	interfaceScale?: number
	hourHeight?: number
	headerHeight?: number
	snapMinutes?: number
}

const DEFAULT_SETTINGS: UserSettings = {
	theme: 'dark',
	colorScheme: 'brisky',
	interfaceScale: 100,
	hourHeight: 80,
	headerHeight: 70,
	snapMinutes: 15,
	defaultStartHour: 9
}

export const useSettingsStore = defineStore('settings', () => {
	const userStore = useUserStore()
	const settingsData = ref<UserSettings>({ ...DEFAULT_SETTINGS })
	const loading = ref(false)

	const settings = computed(() => ({
		...DEFAULT_SETTINGS,
		...settingsData.value
	}))

	const uiScale = computed(() => (settings.value.interfaceScale || 100) / 100)
	const hourHeight = computed(() => (settings.value.hourHeight || 80) * uiScale.value)
	const headerHeight = computed(() => (settings.value.headerHeight || 70) * uiScale.value)

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

	return {
		settings,
		uiScale,
		hourHeight,
		headerHeight,
		loading,
		updateSettings
	}
})
