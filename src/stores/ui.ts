import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
	const isThemePanelOpen = ref(false)
	const createTaskTrigger = ref(0)

	function toggleThemePanel() {
		isThemePanelOpen.value = !isThemePanelOpen.value
	}

	function closeThemePanel() {
		isThemePanelOpen.value = false
	}

	function triggerCreateTask() {
		createTaskTrigger.value++
	}

	return {
		isThemePanelOpen,
		createTaskTrigger,
		toggleThemePanel,
		closeThemePanel,
		triggerCreateTask
	}
})
