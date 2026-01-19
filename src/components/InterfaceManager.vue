<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppearanceStore } from '../stores/appearance'

const appearanceStore = useAppearanceStore()
const { theme, colorScheme, interfaceScale, hourHeight, headerHeight, uiScale } = storeToRefs(appearanceStore)

watch(
	[theme, colorScheme, interfaceScale, hourHeight, headerHeight, uiScale],
	([t, sc, scale, hh, hdh, uis]) => {
		const el = document.documentElement

		el.setAttribute('data-theme', t)
		el.setAttribute('data-scheme', sc)
		el.setAttribute('data-scale', scale.toString())

		el.style.setProperty('--ui-scale', uis.toString())
		el.style.setProperty('--hour-height', `${hh}px`)
		el.style.setProperty('--header-height', `${hdh}px`)
	},
	{ immediate: true }
)
</script>

<template>
	<!-- Headless component managing global attributes -->
</template>
