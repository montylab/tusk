import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'

export const useTimeStore = defineStore('time', () => {
	// --- Current Time Logic ---
	const currentTime = ref(new Date())
	let timer: number | null = null

	function startTicking() {
		if (timer) return
		// Update immediately
		currentTime.value = new Date()
		// Then every minute
		timer = window.setInterval(() => {
			currentTime.value = new Date()
		}, 60000)
	}

	function stopTicking() {
		if (timer) {
			clearInterval(timer)
			timer = null
		}
	}

	// Auto-cleanup if the store itself is disposed (rare in Pinia but good practice)
	onUnmounted(() => {
		stopTicking()
	})

	// --- Hover State Logic ---
	const hoveredTimeRange = ref<{ start: number; duration: number } | null>(null)

	function setHoveredTimeRange(range: { start: number; duration: number } | null) {
		hoveredTimeRange.value = range
	}

	return {
		currentTime,
		hoveredTimeRange,
		startTicking,
		stopTicking,
		setHoveredTimeRange
	}
})
