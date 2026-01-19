import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
	const isThemePanelOpen = ref(false)
	const createTaskTrigger = ref(0)
	const themeTransitionState = ref({
		isActive: false,
		x: 0,
		y: 0,
		targetTheme: null as string | null
	})

	function toggleThemePanel() {
		isThemePanelOpen.value = !isThemePanelOpen.value
	}

	function closeThemePanel() {
		isThemePanelOpen.value = false
	}

	function triggerCreateTask() {
		createTaskTrigger.value++
	}

	function startThemeTransition(x: number, y: number, theme: string) {
		themeTransitionState.value = {
			isActive: true,
			x,
			y,
			targetTheme: theme
		}
	}

	return {
		isThemePanelOpen,
		createTaskTrigger,
		themeTransitionState,
		toggleThemePanel,
		closeThemePanel,
		triggerCreateTask,
		startThemeTransition
	}
})
