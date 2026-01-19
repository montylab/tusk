import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { useUserStore } from './user'
import * as firebaseService from '../services/firebaseService'

export interface UserSettings {
	defaultStartHour?: number
	snapMinutes?: number
}

const DEFAULT_SETTINGS: UserSettings = {
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
		loading,
		updateSettings
	}
})
