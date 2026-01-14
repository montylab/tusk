<script
    setup
    lang="ts"
>
import { watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const scales: Record<string, number> = { '1': 100, '2': 150, '3': 200 }

const handleKeyDown = (e: KeyboardEvent) => {
    if (e.altKey) {
        if (scales[e.key]) {
            settingsStore.updateSettings({ interfaceScale: scales[e.key] })
            e.preventDefault()
        }
    }
}

onMounted(() => window.addEventListener('keydown', handleKeyDown))
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))

// Apply settings to document
watch(settings, (s) => {
    const theme = s.theme || 'dark'
    const scheme = s.colorScheme || 'brisky'
    const scale = s.interfaceScale || 100
    const uiScale = scale / 100

    const el = document.documentElement

    el.setAttribute('data-theme', theme)
    el.setAttribute('data-scheme', scheme)
    el.setAttribute('data-scale', scale.toString())

    el.style.setProperty('--ui-scale', uiScale.toString())
}, { deep: true, immediate: true })
</script>

<template>
    <!-- Headless component managing global attributes -->
</template>
