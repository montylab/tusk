import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import { nerve, NERVE_EVENTS } from '../services/nerve'

export const useTimeStore = defineStore('time', () => {
	// --- Current Time Logic ---
	const currentTime = ref(new Date())
	let timer: number | null = null
	let kickstartTimer: number | null = null

	function startTicking() {
		if (timer || kickstartTimer) return
		// Update immediately
		currentTime.value = new Date()
		// initialization kickstart
		nerve.emit(NERVE_EVENTS.MINUTE_TICK, { date: currentTime.value })

		// Kick start: wait until the beginning of the next minute
		const now = new Date()
		const msUntilNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds())

		kickstartTimer = window.setTimeout(() => {
			currentTime.value = new Date()
			nerve.emit(NERVE_EVENTS.MINUTE_TICK, { date: currentTime.value })

			// Then continue every minute exactly
			timer = window.setInterval(() => {
				currentTime.value = new Date()
				nerve.emit(NERVE_EVENTS.MINUTE_TICK, { date: currentTime.value })
			}, 60000)

			kickstartTimer = null
		}, msUntilNextMinute)
	}

	function stopTicking() {
		if (timer) {
			clearInterval(timer)
			timer = null
		}
		if (kickstartTimer) {
			clearTimeout(kickstartTimer)
			kickstartTimer = null
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
