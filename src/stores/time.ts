import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import { useTasksStore } from './tasks'
import { nerve, NERVE_EVENTS } from '../services/nerve'
import { formatDate } from '../utils/dateUtils'

export const useTimeStore = defineStore('time', () => {
	// --- Current Time Logic ---
	const currentTime = ref(new Date())
	let timer: number | null = null
	let kickstartTimer: number | null = null

	// Track notified tasks to simulate "edge-trigger" (only notify once per task)
	const notifiedTasks = new Set<string>()

	function startTicking() {
		if (timer || kickstartTimer) return
		// Update immediately
		currentTime.value = new Date()
		checkNotifications()

		// Kick start: wait until the beginning of the next minute
		const now = new Date()
		const msUntilNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds())

		kickstartTimer = window.setTimeout(() => {
			currentTime.value = new Date()
			checkNotifications()

			// Then continue every minute exactly
			timer = window.setInterval(() => {
				currentTime.value = new Date()
				checkNotifications()
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

	function checkNotifications() {
		const tasksStore = useTasksStore()
		const now = currentTime.value

		const todayStr = formatDate(now)
		const scheduled = tasksStore.scheduledTasks[todayStr] || []

		const currentDecimal = now.getHours() + now.getMinutes() / 60

		scheduled.forEach((task) => {
			if (typeof task.startTime !== 'number') return

			// Check strict equality or range
			// If we want exact time notification (e.g. 9:00), we check if abs(diff) < small
			const diff = Math.abs(task.startTime - currentDecimal)

			// 0.005 hours is 18 seconds.
			// checking every 10s means we will hit it.
			if (diff < 0.005) {
				const id = String(task.id)
				if (!notifiedTasks.has(id)) {
					// Notify
					nerve.emit(NERVE_EVENTS.TIME_NOTIFICATION, {
						title: 'Task Started',
						body: `It's time for: ${task.text}`
					})
					notifiedTasks.add(id)
				}
			}
		})
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
