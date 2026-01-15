<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()
const { settings, hourHeight, headerHeight, uiScale } = storeToRefs(settingsStore)

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
