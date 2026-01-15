<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()
const { settings, hourHeight, headerHeight, uiScale } = storeToRefs(settingsStore)

const scales: Record<string, number> = { '1': 100, '2': 150, '3': 200 }

const handleKeyDown = (e: KeyboardEvent) => {
	if (e.altKey) {
		if (scales[e.key]) {
			settingsStore.updateSettings({ interfaceScale: scales[e.key] })
			e.preventDefault()
		} else if (e.code === 'Backquote') {
			const newTheme = settings.value.theme === 'light' ? 'dark' : 'light'
			settingsStore.updateSettings({ theme: newTheme })
			e.preventDefault()
		}
	}
}

onMounted(() => window.addEventListener('keydown', handleKeyDown))
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))

// Apply settings to document
watch(
	[settings, hourHeight, headerHeight, uiScale],
	([s, hh, hdh, scale]) => {
		const theme = s.theme || 'dark'
		const scheme = s.colorScheme || 'brisky'

		const el = document.documentElement

		el.setAttribute('data-theme', theme)
		el.setAttribute('data-scheme', scheme)
		el.setAttribute('data-scale', s.interfaceScale?.toString() || '100')

		el.style.setProperty('--ui-scale', scale.toString())
		el.style.setProperty('--hour-height', `${hh}px`)
		el.style.setProperty('--header-height', `${hdh}px`)
	},
	{ immediate: true }
)
</script>

<template>
	<!-- Headless component managing global attributes -->
</template>
