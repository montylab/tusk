import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useUserStore } from './user'
import * as firebaseService from '../services/firebaseService'

export interface UserSettings {
    defaultStartHour?: number
    theme?: 'light' | 'dark'
    colorScheme?: 'pastel' | 'brisky' | 'royal'
    interfaceScale?: number
}

export const useSettingsStore = defineStore('settings', () => {
    const userStore = useUserStore()
    const settings = ref<UserSettings>({})
    const loading = ref(false)
    let unsub: (() => void) | null = null

    watch(() => userStore.user, (u) => {
        if (u) {
            setupSync()
        } else {
            settings.value = {}
            if (unsub) {
                unsub()
                unsub = null
            }
        }
    }, { immediate: true })

    function setupSync() {
        loading.value = true
        if (unsub) unsub()
        unsub = firebaseService.subscribeToSettings((data) => {
            settings.value = data
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
