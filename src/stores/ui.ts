import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
	const isThemePanelOpen = ref(false)

	function toggleThemePanel() {
		isThemePanelOpen.value = !isThemePanelOpen.value
	}

	function closeThemePanel() {
		isThemePanelOpen.value = false
	}

	return {
		isThemePanelOpen,
		toggleThemePanel,
		closeThemePanel
	}
})
