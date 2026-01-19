import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

export const THEMES = ['dark', 'light', 'pinky', 'vivid'] as const
export const SCALES = [50, 75, 100, 150] as const
export const SCHEMES = ['brisky', 'pastel', 'royal'] as const

export type ThemeType = (typeof THEMES)[number]
export type ColorSchemeType = (typeof SCHEMES)[number]

export const useAppearanceStore = defineStore('appearance', () => {
	// Load from localStorage or use defaults
	const saved = JSON.parse(localStorage.getItem('appearance-settings') || '{}')

	const theme = ref<ThemeType>(saved.theme || 'dark')
	const colorScheme = ref<ColorSchemeType>(saved.colorScheme || 'brisky')
	const interfaceScale = ref<number>(saved.interfaceScale || 100)
	const hourHeightBase = ref<number>(saved.hourHeight || 80)
	const headerHeightBase = ref<number>(saved.headerHeight || 70)

	// Derived values
	const uiScale = computed(() => interfaceScale.value / 100)
	const hourHeight = computed(() => hourHeightBase.value * uiScale.value)
	const headerHeight = computed(() => headerHeightBase.value * uiScale.value)

	// Watch for changes and save to localStorage
	watch(
		[theme, colorScheme, interfaceScale, hourHeightBase, headerHeightBase],
		() => {
			localStorage.setItem(
				'appearance-settings',
				JSON.stringify({
					theme: theme.value,
					colorScheme: colorScheme.value,
					interfaceScale: interfaceScale.value,
					hourHeight: hourHeightBase.value,
					headerHeight: headerHeightBase.value
				})
			)
		},
		{ deep: true }
	)

	return {
		theme,
		colorScheme,
		interfaceScale,
		hourHeight,
		headerHeight,
		uiScale,
		hourHeightBase,
		headerHeightBase
	}
})
