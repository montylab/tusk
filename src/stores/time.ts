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
	const notifiedEntryTasks = new Set<string>()
	const notifiedExitTasks = new Set<string>()

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
			const id = String(task.id)

			// --- BEGIN Check ---
			const startDiff = Math.abs(task.startTime - currentDecimal)
			if (startDiff < 0.005) {
				if (!notifiedEntryTasks.has(id)) {
					nerve.emit(NERVE_EVENTS.SCHEDULED_TASK_BEGIN, {
						title: 'Task Started',
						body: `It's time for: ${task.text}`
					})
					notifiedEntryTasks.add(id)
				}
			}

			// --- END Check ---
			if (task.duration) {
				const endTime = task.startTime + task.duration / 60
				const endDiff = Math.abs(endTime - currentDecimal)
				if (endDiff < 0.005) {
					if (!notifiedExitTasks.has(id)) {
						nerve.emit(NERVE_EVENTS.SCHEDULED_TASK_END, {
							title: 'Task Finished',
							body: `${task.text} should be finished now.`
						})
						notifiedExitTasks.add(id)
					}
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
